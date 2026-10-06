import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { applyServerRow, removeFromCache } from '../lib/cacheSync';
import { notifyConflict } from '../lib/conflicts';
import { friendlyError } from '../lib/errors';
import { queryKeys } from '../lib/queryKeys';
import { runSerial } from '../lib/rowQueue';
import {
  createItem,
  deleteItem,
  fetchItems,
  restoreItem,
} from '../services/listItemsService';
import { updateVersioned } from '../services/versionedUpdate';
import type { UpdateOutcome } from '../services/versionedUpdate';
import type { ItemChanges, ListItem } from '../types';
import { patchById, upsertById } from '../utils/cache';
import { assertOnline } from '../utils/network';
import { useAuth } from './useAuth';
import { useWorkspaceId } from './useWorkspaceId';

// Reordenar não gera conflito: vale a última posição gravada.
const SOFT_FIELDS: ReadonlyArray<keyof ListItem> = ['position'];

// Busca os itens de TODAS as listas do workspace de uma vez.
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
    mutationFn: async ({ listId, text }: { listId: string; text: string }) => {
      assertOnline();
      return createItem({ workspaceId, listId, text });
    },
    onSuccess: (row) => {
      queryClient.setQueryData<ListItem[]>(key, (old) => upsertById(old, row));
    },
    onError: (error) => {
      toast.error(friendlyError(error, 'Não foi possível adicionar o item.'));
    },
  });
}

interface UpdateVariables {
  // O item como estava quando a pessoa começou a editar.
  base: ListItem;
  changes: ItemChanges;
}

export function useUpdateItem() {
  const queryClient = useQueryClient();
  const workspaceId = useWorkspaceId();
  const { partner } = useAuth();
  const key = queryKeys.listItems(workspaceId);
  const partnerName = partner?.display_name ?? 'A outra pessoa';

  function save(
    base: ListItem,
    changes: ItemChanges,
    force: boolean,
  ): Promise<UpdateOutcome<ListItem>> {
    return runSerial(base.id, () =>
      updateVersioned<ListItem>('list_items', base, changes, {
        force,
        softFields: SOFT_FIELDS,
      }),
    );
  }

  function handleOutcome(
    outcome: UpdateOutcome<ListItem>,
    base: ListItem,
    changes: ItemChanges,
  ): void {
    if (outcome.status === 'ok') {
      applyServerRow(queryClient, key, outcome.row);
      return;
    }
    if (outcome.status === 'gone') {
      removeFromCache(queryClient, key, base.id);
      toast.info(`${partnerName} removeu este item.`);
      return;
    }
    // Conflito: a versão da outra pessoa fica na tela e a pessoa escolhe.
    const { server, field } = outcome;
    applyServerRow(queryClient, key, server);
    notifyConflict({
      partnerName,
      field,
      mine: changes[field as keyof ItemChanges],
      theirs: server[field as keyof ListItem],
      onUseMine: () => {
        void forceMine(server, changes);
      },
    });
  }

  async function forceMine(server: ListItem, changes: ItemChanges): Promise<void> {
    try {
      assertOnline();
      queryClient.setQueryData<ListItem[]>(key, (old) => patchById(old, server.id, changes));
      const outcome = await save(server, changes, true);
      handleOutcome(outcome, server, changes);
    } catch (error) {
      toast.error(friendlyError(error, 'Não foi possível salvar a sua versão.'));
      void queryClient.invalidateQueries({ queryKey: key });
    }
  }

  return useMutation({
    mutationFn: ({ base, changes }: UpdateVariables) => save(base, changes, false),
    // Atualização otimista: a tela muda na hora.
    onMutate: async ({ base, changes }) => {
      assertOnline();
      await queryClient.cancelQueries({ queryKey: key });
      queryClient.setQueryData<ListItem[]>(key, (old) => patchById(old, base.id, changes));
    },
    onSuccess: (outcome, { base, changes }) => {
      handleOutcome(outcome, base, changes);
    },
    onError: (error) => {
      toast.error(friendlyError(error, 'Não foi possível salvar a alteração.'));
      void queryClient.invalidateQueries({ queryKey: key });
    },
  });
}

export function useDeleteItem() {
  const queryClient = useQueryClient();
  const workspaceId = useWorkspaceId();
  const key = queryKeys.listItems(workspaceId);

  return useMutation({
    mutationFn: async (item: ListItem) => {
      assertOnline();
      await deleteItem(item.id);
    },
    onMutate: async (item) => {
      await queryClient.cancelQueries({ queryKey: key });
      removeFromCache(queryClient, key, item.id);
    },
    onError: (error, item) => {
      // Devolve só este item (sem mexer no resto da lista).
      queryClient.setQueryData<ListItem[]>(key, (old) => upsertById(old, item));
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