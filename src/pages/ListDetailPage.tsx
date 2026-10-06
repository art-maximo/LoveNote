import { useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { ArrowLeft, ListChecks, Trash2 } from 'lucide-react';
import { AddItemForm } from '../components/lists/AddItemForm';
import { ListItemRow } from '../components/lists/ListItemRow';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { EmptyState } from '../components/ui/EmptyState';
import { ErrorState } from '../components/ui/ErrorState';
import { InlineEditableText } from '../components/ui/InlineEditableText';
import { Skeleton } from '../components/ui/Skeleton';
import { useAddItem, useDeleteItem, useItems, useUpdateItem } from '../hooks/useListItems';
import { useDeleteList, useRenameList } from '../hooks/useListMutations';
import { useLists } from '../hooks/useLists';
import { friendlyError } from '../lib/errors';
import type { List } from '../types';
import { positionBetween } from '../utils/ordering';

export function ListDetailPage() {
  const { listId } = useParams<{ listId: string }>();
  const navigate = useNavigate();

  const listsQuery = useLists();
  const itemsQuery = useItems();
  const renameList = useRenameList();
  const deleteList = useDeleteList();
  const addItem = useAddItem();
  const updateItem = useUpdateItem();
  const deleteItem = useDeleteItem();
  const [confirmOpen, setConfirmOpen] = useState(false);
  // A lista como estava quando a pessoa começou a editar o nome.
  const listBaseRef = useRef<List | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const list = listsQuery.data?.find((entry) => entry.id === listId);

  const items = useMemo(
    () =>
      (itemsQuery.data ?? [])
        .filter((item) => item.list_id === listId)
        .sort((a, b) => a.position - b.position),
    [itemsQuery.data, listId],
  );

  const doneCount = items.filter((item) => item.is_done).length;

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = items.findIndex((item) => item.id === active.id);
    const newIndex = items.findIndex((item) => item.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;

    // Só o item movido é gravado, com uma posição entre os novos vizinhos.
    const movedItem = items[oldIndex];
    const reordered = arrayMove(items, oldIndex, newIndex);
    const position = positionBetween(
      reordered[newIndex - 1]?.position,
      reordered[newIndex + 1]?.position,
    );
    updateItem.mutate({ base: movedItem, changes: { position } });
  }

  if (listsQuery.isPending) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-11" />
        <Skeleton className="h-14" />
        <Skeleton className="h-14" />
      </div>
    );
  }

  if (listsQuery.isError) {
    return (
      <ErrorState
        message={friendlyError(listsQuery.error, 'Não foi possível carregar a lista.')}
        onRetry={() => void listsQuery.refetch()}
      />
    );
  }

  if (!list) {
    return (
      <EmptyState
        icon={ListChecks}
        title="Lista não encontrada"
        description="Ela pode ter sido excluída ou o link está incorreto."
      >
        <Link
          to="/listas"
          className="rounded-xl bg-rose-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-rose-600"
        >
          Ver todas as listas
        </Link>
      </EmptyState>
    );
  }

  const summary =
    items.length === 0
      ? 'Sem itens ainda'
      : `${doneCount} de ${items.length} ${items.length === 1 ? 'concluído' : 'concluídos'}`;

  return (
    <div>
      <Link
        to="/listas"
        className="mb-3 inline-flex items-center gap-1 text-sm text-stone-500 transition hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-200"
      >
        <ArrowLeft className="h-4 w-4" />
        Listas
      </Link>

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <InlineEditableText
            value={list.title}
            ariaLabel="Nome da lista"
            className="text-2xl font-semibold tracking-tight"
            onStart={() => {
              listBaseRef.current = list;
            }}
            onSave={(title) =>
              renameList.mutate({ base: listBaseRef.current ?? list, title })
            }
          />
          <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">{summary}</p>
        </div>
        <button
          type="button"
          onClick={() => setConfirmOpen(true)}
          aria-label="Excluir lista"
          title="Excluir lista"
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-stone-400 transition hover:bg-stone-200/70 hover:text-rose-600 dark:hover:bg-stone-800"
        >
          <Trash2 className="h-5 w-5" />
        </button>
      </div>

      <div className="mt-6">
        <AddItemForm onAdd={(text) => addItem.mutate({ listId: list.id, text })} />
      </div>

      <div className="mt-4">
        {itemsQuery.isPending ? (
          <div className="space-y-2">
            <Skeleton className="h-12" />
            <Skeleton className="h-12" />
          </div>
        ) : itemsQuery.isError ? (
          <ErrorState
            message={friendlyError(itemsQuery.error, 'Não foi possível carregar os itens.')}
            onRetry={() => void itemsQuery.refetch()}
          />
        ) : items.length === 0 ? (
          <EmptyState
            icon={ListChecks}
            title="Nenhum item ainda"
            description="Digite acima e aperte Enter para adicionar o primeiro."
          />
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={items.map((item) => item.id)}
              strategy={verticalListSortingStrategy}
            >
              <ul className="space-y-2">
                {items.map((item) => (
                  <ListItemRow
                    key={item.id}
                    item={item}
                    onChange={(changes, base) =>
                      updateItem.mutate({ base: base ?? item, changes })
                    }
                    onDelete={() => deleteItem.mutate(item)}
                  />
                ))}
              </ul>
            </SortableContext>
          </DndContext>
        )}
      </div>

      <ConfirmDialog
        open={confirmOpen}
        title="Excluir lista"
        message={`Tem certeza que deseja excluir a lista "${list.title}"?`}
        confirmLabel="Excluir"
        loading={deleteList.isPending}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() =>
          deleteList.mutate(list.id, {
            onSuccess: () => navigate('/listas', { replace: true }),
            onSettled: () => setConfirmOpen(false),
          })
        }
      />
    </div>
  );
}