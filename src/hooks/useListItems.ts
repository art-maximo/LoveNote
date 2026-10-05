import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { friendlyError } from '../lib/errors';
import { queryKeys } from '../lib/queryKeys';
import {
  createItem,
  deleteItem,
  fetchItems,
  restoreItem,
  updateItem,
} from '../services/listItemsService';
import type { ItemChanges, ListItem } from '../types';
import { patchById, removeById, upsertById } from '../utils/cache';
import { useWorkspaceId } from './useWorkspaceId';

// Busca os itens de TODAS as listas do workspace de uma vez.
// É pouco dado e simplifica o cache (e o Realtime da Fase 5).
export function useItems() {
  const workspaceId = useWorkspaceId();
  return useQuery({
    queryKey: queryKeys.listItems(workspaceId),
    queryFn: () => fetchItems(workspaceId),
  });
}

export function useAddItem() {
  const queryClient = useQueryClient();
  const workspaceId = useWorkspaceId();
  const key = queryKeys.listItems(workspaceId);

  return useMutation({
    mutationFn: ({ listId, text }: { listId: string; text: string }) =>
      createItem({ workspaceId, listId, text }),
    onSuccess: (row) => {
      queryClient.setQueryData<ListItem[]>(key, (old) => upsertById(old, row));
    },
    onError: (error) => {
      toast.error(friendlyError(error, 'Não foi possível adicionar o item.'));
    },
  });
}

export function useUpdateItem() {
  const queryClient = useQueryClient();
  const workspaceId = useWorkspaceId();
  const key = queryKeys.listItems(workspaceId);

  return useMutation({
    mutationFn: ({ id, changes }: { id: string; changes: ItemChanges }) =>
      updateItem(id, changes),
    onMutate: async ({ id, changes }) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<ListItem[]>(key);
      queryClient.setQueryData<ListItem[]>(key, (old) => patchById(old, id, changes));
      return { previous };
    },
    onError: (error, _variables, context) => {
      if (context?.previous) queryClient.setQueryData(key, context.previous);
      toast.error(friendlyError(error, 'Não foi possível salvar a alteração.'));
    },
    onSuccess: (row) => {
      // Só atualiza os metadados do servidor, sem sobrescrever o que o usuário
      // acabou de fazer na tela.
      queryClient.setQueryData<ListItem[]>(key, (old) =>
        patchById(old, row.id, { version: row.version, updated_at: row.updated_at }),
      );
    },
  });
}

export function useDeleteItem() {
  const queryClient = useQueryClient();
  const workspaceId = useWorkspaceId();
  const key = queryKeys.listItems(workspaceId);

  return useMutation({
    mutationFn: (item: ListItem) => deleteItem(item.id),
    onMutate: async (item) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<ListItem[]>(key);
      queryClient.setQueryData<ListItem[]>(key, (old) => removeById(old, item.id));
      return { previous };
    },
    onError: (error, _item, context) => {
      if (context?.previous) queryClient.setQueryData(key, context.previous);
      toast.error(friendlyError(error, 'Não foi possível remover o item.'));
    },
    onSuccess: (_data, item) => {
      toast('Item removido.', {
        action: {
          label: 'Desfazer',
          onClick: () => {
            restoreItem(item)
              .then((row) => {
                queryClient.setQueryData<ListItem[]>(key, (old) => upsertById(old, row));
              })
              .catch((error: unknown) => {
                toast.error(friendlyError(error, 'Não foi possível desfazer.'));
              });
          },
        },
      });
    },
  });
}