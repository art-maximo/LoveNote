import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ListChecks } from 'lucide-react';
import { ListCard } from '../components/lists/ListCard';
import { NewListForm } from '../components/lists/NewListForm';
import { EmptyState } from '../components/ui/EmptyState';
import { ErrorState } from '../components/ui/ErrorState';
import { Skeleton } from '../components/ui/Skeleton';
import { useCreateList } from '../hooks/useListMutations';
import { useItems } from '../hooks/useListItems';
import { useLists } from '../hooks/useLists';
import { friendlyError } from '../lib/errors';

interface ListStats {
  total: number;
  done: number;
}

export function ListsPage() {
  const navigate = useNavigate();
  const listsQuery = useLists();
  const itemsQuery = useItems();
  const createList = useCreateList();

  // Total de itens e concluídos de cada lista
  const stats = useMemo(() => {
    const map = new Map<string, ListStats>();
    for (const item of itemsQuery.data ?? []) {
      const current = map.get(item.list_id) ?? { total: 0, done: 0 };
      current.total += 1;
      if (item.is_done) current.done += 1;
      map.set(item.list_id, current);
    }
    return map;
  }, [itemsQuery.data]);

  function handleCreate(title: string) {
    createList.mutate(title, {
      onSuccess: (list) => navigate(`/listas/${list.id}`),
    });
  }

  const lists = listsQuery.data ?? [];

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Listas</h1>
      <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
        Compras, ideias, filmes para ver... tudo que vocês querem organizar juntos.
      </p>

      <div className="mt-6">
        <NewListForm onCreate={handleCreate} pending={createList.isPending} />
      </div>

      <div className="mt-6">
        {listsQuery.isPending ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
          </div>
        ) : listsQuery.isError ? (
          <ErrorState
            message={friendlyError(listsQuery.error, 'Não foi possível carregar as listas.')}
            onRetry={() => void listsQuery.refetch()}
          />
        ) : lists.length === 0 ? (
          <EmptyState
            icon={ListChecks}
            title="Nenhuma lista ainda"
            description="Crie a primeira lista acima. Por exemplo: Compras do mês."
          />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {lists.map((list) => {
              const listStats = stats.get(list.id);
              return (
                <ListCard
                  key={list.id}
                  list={list}
                  total={listStats?.total ?? 0}
                  done={listStats?.done ?? 0}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}