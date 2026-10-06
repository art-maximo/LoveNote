import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { applyServerRow, removeFromCache } from '../lib/cacheSync';
import { notifyConflict } from '../lib/conflicts';
import { friendlyError } from '../lib/errors';
import { queryKeys } from '../lib/queryKeys';
import { runSerial } from '../lib/rowQueue';
import { createList, deleteList } from '../services/listsService';
import { updateVersioned } from '../services/versionedUpdate';
import type { UpdateOutcome } from '../services/versionedUpdate';
import type { List } from '../types';
import { upsertById } from '../utils/cache';
import { assertOnline } from '../utils/network';
import { useAuth } from './useAuth';
import { useWorkspaceId } from './useWorkspaceId';

export function useCreateList() {
  const queryClient = useQueryClient();
  const workspaceId = useWorkspaceId();
  const key = queryKeys.lists(workspaceId);

  return useMutation({
    mutationFn: async (title: string) => {
      assertOnline();
      return createList(workspaceId, title);
    },
    onSuccess: (row) => {
      queryClient.setQueryData<List[]>(key, (old) => upsertById(old, row));
      toast.success('Lista criada.');
    },
    onError: (error) => {
      toast.error(friendlyError(error, 'Não foi possível criar a lista.'));
    },
  });
}

interface RenameVariables {
  // A lista como estava quando a pessoa começou a editar o nome.
  base: List;
  title: string;
}

export function useRenameList() {
  const queryClient = useQueryClient();
  const workspaceId = useWorkspaceId();
  const { partner } = useAuth();
  const key = queryKeys.lists(workspaceId);
  const partnerName = partner?.display_name ?? 'A outra pessoa';

  function save(base: List, title: string, force: boolean): Promise<UpdateOutcome<List>> {
    return runSerial(base.id, () =>
      updateVersioned<List>('lists', base, { title }, { force }),
    );
  }

  function handleOutcome(outcome: UpdateOutcome<List>, base: List, title: string): void {
    if (outcome.status === 'ok') {
      applyServerRow(queryClient, key, outcome.row);
      toast.success('Salvo');
      return;
    }
    if (outcome.status === 'gone') {
      removeFromCache(queryClient, key, base.id);
      toast.info(`${partnerName} excluiu esta lista.`);
      return;
    }
    const { server } = outcome;
    applyServerRow(queryClient, key, server);
    notifyConflict({
      partnerName,
      field: 'title',
      mine: title,
      theirs: server.title,
      onUseMine: () => {
        void forceMine(server, title);
      },
    });
  }

  async function forceMine(server: List, title: string): Promise<void> {
    try {
      assertOnline();
      queryClient.setQueryData<List[]>(key, (old) =>
        (old ?? []).map((entry) => (entry.id === server.id ? { ...entry, title } : entry)),
      );
      const outcome = await save(server, title, true);
      handleOutcome(outcome, server, title);
    } catch (error) {
      toast.error(friendlyError(error, 'Não foi possível salvar o nome.'));
      void queryClient.invalidateQueries({ queryKey: key });
    }
  }

  return useMutation({
    mutationFn: ({ base, title }: RenameVariables) => save(base, title, false),
    // Atualização otimista: a tela muda na hora.
    onMutate: async ({ base, title }) => {
      assertOnline();
      await queryClient.cancelQueries({ queryKey: key });
      queryClient.setQueryData<List[]>(key, (old) =>
        (old ?? []).map((entry) => (entry.id === base.id ? { ...entry, title } : entry)),
      );
    },
    onSuccess: (outcome, { base, title }) => {
      handleOutcome(outcome, base, title);
    },
    onError: (error) => {
      toast.error(friendlyError(error, 'Não foi possível renomear a lista.'));
      void queryClient.invalidateQueries({ queryKey: key });
    },
  });
}

export function useDeleteList() {
  const queryClient = useQueryClient();
  const workspaceId = useWorkspaceId();
  const key = queryKeys.lists(workspaceId);

  return useMutation({
    mutationFn: async (id: string) => {
      assertOnline();
      await deleteList(id);
    },
    onSuccess: (_data, id) => {
      removeFromCache(queryClient, key, id);
      toast.success('Lista excluída.');
    },
    onError: (error) => {
      toast.error(friendlyError(error, 'Não foi possível excluir a lista.'));
    },
  });
}