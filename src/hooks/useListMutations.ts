import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { friendlyError } from '../lib/errors';
import { queryKeys } from '../lib/queryKeys';
import { createList, deleteList, renameList } from '../services/listsService';
import type { List } from '../types';
import { patchById, removeById, upsertById } from '../utils/cache';
import { useWorkspaceId } from './useWorkspaceId';

export function useCreateList() {
  const queryClient = useQueryClient();
  const workspaceId = useWorkspaceId();
  const key = queryKeys.lists(workspaceId);

  return useMutation({
    mutationFn: (title: string) => createList(workspaceId, title),
    onSuccess: (row) => {
      queryClient.setQueryData<List[]>(key, (old) => upsertById(old, row));
      toast.success('Lista criada.');
    },
    onError: (error) => {
      toast.error(friendlyError(error, 'Não foi possível criar a lista.'));
    },
  });
}

export function useRenameList() {
  const queryClient = useQueryClient();
  const workspaceId = useWorkspaceId();
  const key = queryKeys.lists(workspaceId);

  return useMutation({
    mutationFn: ({ id, title }: { id: string; title: string }) => renameList(id, title),
    // Atualização otimista: a tela muda na hora; se falhar, volta ao que era.
    onMutate: async ({ id, title }) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<List[]>(key);
      queryClient.setQueryData<List[]>(key, (old) => patchById(old, id, { title }));
      return { previous };
    },
    onError: (error, _variables, context) => {
      if (context?.previous) queryClient.setQueryData(key, context.previous);
      toast.error(friendlyError(error, 'Não foi possível renomear a lista.'));
    },
    onSuccess: (row) => {
      queryClient.setQueryData<List[]>(key, (old) => upsertById(old, row));
      toast.success('Salvo');
    },
  });
}

export function useDeleteList() {
  const queryClient = useQueryClient();
  const workspaceId = useWorkspaceId();
  const key = queryKeys.lists(workspaceId);

  return useMutation({
    mutationFn: (id: string) => deleteList(id),
    onSuccess: (_data, id) => {
      queryClient.setQueryData<List[]>(key, (old) => removeById(old, id));
      toast.success('Lista excluída.');
    },
    onError: (error) => {
      toast.error(friendlyError(error, 'Não foi possível excluir a lista.'));
    },
  });
}