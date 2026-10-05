import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import type { List } from '../../types';

interface ListCardProps {
  list: List;
  total: number;
  done: number;
}

export function ListCard({ list, total, done }: ListCardProps) {
  const percent = total === 0 ? 0 : Math.round((done / total) * 100);

  return (
    <Link
      to={`/listas/${list.id}`}
      className="block rounded-2xl border border-stone-200 bg-white p-4 transition hover:border-rose-300 hover:shadow-sm focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-rose-200 dark:border-stone-800 dark:bg-stone-900 dark:hover:border-rose-500/50 dark:focus-visible:ring-rose-400/30"
    >
      <div className="flex items-center justify-between gap-3">
        <h2 className="truncate font-medium">{list.title}</h2>
        <ChevronRight className="h-4 w-4 shrink-0 text-stone-400" />
      </div>
      <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
        {total === 0 ? 'Sem itens' : `${done} de ${total} concluídos`}
      </p>
      {total > 0 && (
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-stone-100 dark:bg-stone-800">
          <div
            className="h-full rounded-full bg-rose-400 transition-all"
            style={{ width: `${percent}%` }}
          />
        </div>
      )}
    </Link>
  );
}