import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Trash2 } from 'lucide-react';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { NoteConflictPanel } from './NoteConflictPanel';
import { SaveStatus } from './SaveStatus';
import { useAuth } from '../../hooks/useAuth';
import { useConnection } from '../../hooks/useConnection';
import { useDeleteNote } from '../../hooks/useNotes';
import { useNoteAutosave } from '../../hooks/useNoteAutosave';
import { useViewing } from '../../hooks/useViewing';
import type { Note } from '../../types';
import { formatDateTime } from '../../utils/dates';

interface NoteEditorProps {
  note: Note;
}

export function NoteEditor({ note }: NoteEditorProps) {
  const navigate = useNavigate();
  const { profile, partner } = useAuth();
  const { partnerViewing } = useConnection();
  const deleteNote = useDeleteNote();
  const autosave = useNoteAutosave(note);
  useViewing(`note:${note.id}`);

  const [confirmOpen, setConfirmOpen] = useState(false);
  // Anotação recém-criada: já abre com o cursor no título.
  const [startWithTitleFocus] = useState(
    () => note.title === 'Sem título' && note.content === '',
  );

  const titleRef = useRef<HTMLInputElement>(null);
  const contentRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (startWithTitleFocus) {
      titleRef.current?.focus();
      titleRef.current?.select();
    }
  }, [startWithTitleFocus]);

  // O campo de texto cresce junto com o conteúdo.
  useLayoutEffect(() => {
    const element = contentRef.current;
    if (!element) return;
    element.style.height = 'auto';
    element.style.height = `${element.scrollHeight}px`;
  }, [autosave.content]);

  function nameOf(id: string | null): string {
    if (!id) return 'alguém';
    if (id === profile?.id) return 'você';
    if (id === partner?.id) return partner.display_name;
    return 'alguém';
  }

  const readOnly = autosave.conflict !== null;
  const partnerHere = partner !== null && partnerViewing === `note:${note.id}`;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-3">
        <Link
          to="/notas"
          className="inline-flex items-center gap-1 text-sm text-stone-500 transition hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-200"
        >
          <ArrowLeft className="h-4 w-4" />
          Anotações
        </Link>
        <div className="flex items-center gap-3">
          <SaveStatus status={autosave.status} onRetry={() => void autosave.flush()} />
          <button
            type="button"
            onClick={() => setConfirmOpen(true)}
            aria-label="Excluir anotação"
            title="Excluir anotação"
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-stone-400 transition hover:bg-stone-200/70 hover:text-rose-600 dark:hover:bg-stone-800"
          >
            <Trash2 className="h-5 w-5" />
          </button>
        </div>
      </div>

      {partnerHere && partner && (
        <p className="mb-4 inline-flex items-center gap-2 rounded-full bg-violet-100 px-3 py-1 text-xs font-medium text-violet-700 dark:bg-violet-500/15 dark:text-violet-300">
          <span className="h-2 w-2 rounded-full bg-emerald-500" aria-hidden="true" />
          {partner.display_name} está com esta anotação aberta
        </p>
      )}

      {autosave.conflict && (
        <NoteConflictPanel
          partnerName={partner?.display_name ?? 'A outra pessoa'}
          conflict={autosave.conflict}
          mine={autosave.conflict.field === 'title' ? autosave.title : autosave.content}
          onKeepMine={autosave.keepMine}
          onAcceptTheirs={autosave.acceptTheirs}
          onSaveCopy={() => void autosave.saveAsCopy()}
        />
      )}

      <input
        ref={titleRef}
        type="text"
        value={autosave.title}
        maxLength={200}
        readOnly={readOnly}
        placeholder="Sem título"
        aria-label="Título da anotação"
        onChange={(event) => autosave.setTitle(event.target.value)}
        onBlur={() => void autosave.flush()}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.preventDefault();
            contentRef.current?.focus();
          }
        }}
        className="w-full rounded-xl border border-transparent bg-transparent px-2 py-1 text-2xl font-semibold tracking-tight outline-none transition placeholder:text-stone-300 focus:border-stone-200 dark:placeholder:text-stone-600 dark:focus:border-stone-700"
      />

      <textarea
        ref={contentRef}
        value={autosave.content}
        maxLength={100000}
        readOnly={readOnly}
        placeholder="Escreva aqui..."
        aria-label="Texto da anotação"
        onChange={(event) => autosave.setContent(event.target.value)}
        onBlur={() => void autosave.flush()}
        className="mt-3 min-h-[45dvh] w-full resize-none overflow-hidden rounded-xl border border-transparent bg-transparent px-2 py-1 text-base leading-7 outline-none transition placeholder:text-stone-400 focus:border-stone-200 dark:placeholder:text-stone-500 dark:focus:border-stone-700"
      />

      <p className="mt-6 border-t border-stone-200 pt-4 text-xs text-stone-500 dark:border-stone-800 dark:text-stone-400">
        Criada por {nameOf(note.created_by)} em {formatDateTime(note.created_at)}
        <br />
        Última edição por {nameOf(note.updated_by)} em {formatDateTime(note.updated_at)}
      </p>

      <ConfirmDialog
        open={confirmOpen}
        title="Excluir anotação"
        message={`Tem certeza que deseja excluir a anotação "${note.title.trim() || 'Sem título'}"?`}
        confirmLabel="Excluir"
        loading={deleteNote.isPending}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() => {
          // O que estava pendente não deve ser salvo numa anotação excluída.
          autosave.discard();
          deleteNote.mutate(note.id, {
            onSuccess: () => navigate('/notas', { replace: true }),
            onSettled: () => setConfirmOpen(false),
          });
        }}
      />
    </div>
  );
}