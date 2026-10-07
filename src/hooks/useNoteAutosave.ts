import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { applyServerRow, removeFromCache } from '../lib/cacheSync';
import { friendlyError } from '../lib/errors';
import { queryKeys } from '../lib/queryKeys';
import { runSerial } from '../lib/rowQueue';
import { createNote } from '../services/notesService';
import { updateVersioned } from '../services/versionedUpdate';
import type { Note } from '../types';
import { upsertById } from '../utils/cache';
import { useWorkspaceId } from './useWorkspaceId';

export type NoteField = 'title' | 'content';

export type SaveStatus = 'saved' | 'dirty' | 'saving' | 'offline' | 'error' | 'conflict';

// Só os campos que a pessoa mexeu. Os demais continuam "ao vivo" (vindos do servidor).
type Draft = Partial<Record<NoteField, string>>;

// A anotação como estava quando a pessoa começou a editar cada campo.
type Bases = Partial<Record<NoteField, Note>>;

export interface NoteConflict {
  field: NoteField;
  mine: string;
  server: Note;
}

const DEBOUNCE_MS = 800;
const FIELDS: NoteField[] = ['title', 'content'];

function isDirtyField(draft: Draft, bases: Bases, field: NoteField): boolean {
  const value = draft[field];
  const base = bases[field];
  return value !== undefined && base !== undefined && value !== base[field];
}

export function useNoteAutosave(note: Note) {
  const queryClient = useQueryClient();
  const workspaceId = useWorkspaceId();
  const key = useMemo(() => queryKeys.notes(workspaceId), [workspaceId]);

  const [draft, setDraftState] = useState<Draft>({});
  const [status, setStatus] = useState<SaveStatus>('saved');
  const [conflict, setConflictState] = useState<NoteConflict | null>(null);

  const noteRef = useRef<Note>(note);
  const draftRef = useRef<Draft>({});
  const basesRef = useRef<Bases>({});
  const timerRef = useRef<number | null>(null);
  const savingRef = useRef(false);
  const conflictRef = useRef<NoteConflict | null>(null);
  const mountedRef = useRef(true);
  const flushRef = useRef<() => Promise<void>>(() => Promise.resolve());

  useEffect(() => {
    noteRef.current = note;
  });

  const publishDraft = useCallback((next: Draft) => {
    draftRef.current = next;
    setDraftState(next);
  }, []);

  const dropField = useCallback(
    (field: NoteField) => {
      const next: Draft = { ...draftRef.current };
      delete next[field];
      delete basesRef.current[field];
      publishDraft(next);
    },
    [publishDraft],
  );

  const setConflict = useCallback((value: NoteConflict | null) => {
    conflictRef.current = value;
    setConflictState(value);
  }, []);

  // Agenda o salvamento para daqui a pouco (cada tecla reinicia a contagem).
  const schedule = useCallback(() => {
    if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => {
      timerRef.current = null;
      void flushRef.current();
    }, DEBOUNCE_MS);
  }, []);

  // Salva a versão da pessoa como uma anotação nova (sem perder nada).
  const saveCopy = useCallback(
    async (source: NoteConflict, mine: string): Promise<boolean> => {
      try {
        const row = await createNote({
          workspaceId,
          title: `${source.server.title} (minha versão)`,
          content: mine,
        });
        queryClient.setQueryData<Note[]>(key, (old) => upsertById(old, row));
        toast.success('Sua versão foi salva como uma nova anotação.');
        return true;
      } catch (error) {
        toast.error(
          friendlyError(error, 'Não foi possível salvar a sua versão como nova anotação.'),
        );
        return false;
      }
    },
    [queryClient, key, workspaceId],
  );

  const flush = useCallback(async (): Promise<void> => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (savingRef.current) return;

    // Conflito em aberto: espera a decisão. Se a pessoa já saiu da tela,
    // a versão dela é preservada como anotação nova.
    if (conflictRef.current !== null) {
      if (mountedRef.current) return;
      const abandoned = conflictRef.current;
      setConflict(null);
      if (abandoned.field === 'content') {
        const mine = draftRef.current.content ?? abandoned.mine;
        await saveCopy(abandoned, mine);
      } else {
        toast.warning('A alteração do título foi descartada: a outra pessoa também o alterou.');
      }
      dropField(abandoned.field);
    }

    // Descarta rascunhos que ficaram iguais ao original
    for (const field of FIELDS) {
      if (
        draftRef.current[field] !== undefined &&
        !isDirtyField(draftRef.current, basesRef.current, field)
      ) {
        dropField(field);
      }
    }

    const pending = FIELDS.filter((field) =>
      isDirtyField(draftRef.current, basesRef.current, field),
    );
    if (pending.length === 0) {
      setStatus('saved');
      return;
    }

    if (!navigator.onLine) {
      setStatus('offline');
      return;
    }

    savingRef.current = true;
    setStatus('saving');
    let stopped = false;

    try {
      for (const field of pending) {
        const value = draftRef.current[field];
        const base = basesRef.current[field];
        if (value === undefined || base === undefined) continue;

        const changes: Partial<Note> = field === 'title' ? { title: value } : { content: value };
        const outcome = await runSerial(base.id, () =>
          updateVersioned<Note>('notes', base, changes),
        );

        if (outcome.status === 'ok') {
          applyServerRow(queryClient, key, outcome.row);
          basesRef.current[field] = outcome.row;
          // Se a pessoa não digitou mais nada durante o salvamento, o rascunho acabou.
          if (draftRef.current[field] === value) dropField(field);
          continue;
        }

        if (outcome.status === 'gone') {
          removeFromCache(queryClient, key, base.id);
          toast.info('Esta anotação foi excluída.');
          setStatus('saved');
          stopped = true;
          break;
        }

        // Conflito: a outra pessoa mudou o mesmo campo. A versão dela já está
        // no cache; a sua continua na tela até você decidir.
        applyServerRow(queryClient, key, outcome.server);
        const found: NoteConflict = { field, mine: value, server: outcome.server };

        if (mountedRef.current) {
          setConflict(found);
          setStatus('conflict');
          stopped = true;
          break;
        }

        // A pessoa já saiu da anotação: nada se perde.
        if (field === 'content') {
          await saveCopy(found, value);
        } else {
          toast.warning(
            'A alteração do título foi descartada: a outra pessoa também o alterou.',
          );
        }
        dropField(field);
      }
    } catch (error) {
      stopped = true;
      if (!navigator.onLine) {
        setStatus('offline');
      } else {
        setStatus('error');
        toast.error(friendlyError(error, 'Não foi possível salvar a anotação.'));
      }
    } finally {
      savingRef.current = false;
    }

    if (stopped) return;

    // A pessoa continuou digitando durante o salvamento?
    const stillDirty = FIELDS.some((field) =>
      isDirtyField(draftRef.current, basesRef.current, field),
    );
    if (stillDirty) {
      setStatus('dirty');
      schedule();
    } else {
      setStatus('saved');
    }
  }, [queryClient, key, dropField, setConflict, saveCopy, schedule]);

  useEffect(() => {
    flushRef.current = flush;
  }, [flush]);

  const setField = useCallback(
    (field: NoteField, value: string) => {
      if (basesRef.current[field] === undefined) {
        basesRef.current[field] = noteRef.current;
      }
      const next: Draft = { ...draftRef.current };
      next[field] = value;
      publishDraft(next);
      if (conflictRef.current === null) setStatus('dirty');
      schedule();
    },
    [publishDraft, schedule],
  );

  const setTitle = useCallback((value: string) => setField('title', value), [setField]);
  const setContent = useCallback((value: string) => setField('content', value), [setField]);

  // --- Decisões sobre um conflito ---

  // Manter a minha: passa a partir da versão mais nova do servidor e salva de novo.
  const keepMine = useCallback(() => {
    const current = conflictRef.current;
    if (!current) return;
    setConflict(null);
    basesRef.current[current.field] = current.server;
    setStatus('dirty');
    void flushRef.current();
  }, [setConflict]);

  // Usar a dela: descarta a minha alteração naquele campo.
  const acceptTheirs = useCallback(() => {
    const current = conflictRef.current;
    if (!current) return;
    setConflict(null);
    dropField(current.field);
    const stillDirty = FIELDS.some((field) =>
      isDirtyField(draftRef.current, basesRef.current, field),
    );
    if (stillDirty) {
      setStatus('dirty');
      schedule();
    } else {
      setStatus('saved');
    }
  }, [setConflict, dropField, schedule]);

  // Salvar a minha como nova anotação e ficar com a versão dela nesta.
  const saveAsCopy = useCallback(async () => {
    const current = conflictRef.current;
    if (!current || current.field !== 'content') return;
    const mine = draftRef.current.content ?? current.mine;
    const saved = await saveCopy(current, mine);
    if (saved) acceptTheirs();
  }, [saveCopy, acceptTheirs]);

  // Descarta qualquer rascunho (usado antes de excluir a anotação).
  const discard = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    basesRef.current = {};
    publishDraft({});
    setConflict(null);
    setStatus('saved');
  }, [publishDraft, setConflict]);

  // --- Efeitos de ciclo de vida ---

  // Ao sair da anotação, salva o que estiver pendente.
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      void flushRef.current();
    };
  }, []);

  // Salva quando a internet volta e quando a aba/app vai para segundo plano.
  useEffect(() => {
    function handleOnline(): void {
      void flushRef.current();
    }
    function handleVisibility(): void {
      if (document.visibilityState === 'hidden') void flushRef.current();
    }
    window.addEventListener('online', handleOnline);
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      window.removeEventListener('online', handleOnline);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  // Avisa antes de fechar a aba com alterações ainda não salvas.
  useEffect(() => {
    if (status === 'saved') return;
    function handleBeforeUnload(event: BeforeUnloadEvent): void {
      event.preventDefault();
    }
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [status]);

  return {
    // Mostra o rascunho enquanto você edita; senão, o valor mais recente do servidor.
    title: draft.title ?? note.title,
    content: draft.content ?? note.content,
    setTitle,
    setContent,
    status,
    conflict,
    flush,
    keepMine,
    acceptTheirs,
    saveAsCopy,
    discard,
  };
}