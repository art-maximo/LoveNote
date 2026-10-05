import { Link } from 'react-router-dom';
import { ChevronRight, ListChecks } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useLists } from '../hooks/useLists';
import { getGreeting } from '../utils/greeting';

export function HomePage() {
  const { profile, partner } = useAuth();
  const listsQuery = useLists();
  const count = listsQuery.data?.length;

  let listsSummary = 'Carregando...';
  if (count !== undefined) {
    listsSummary =
      count === 0 ? 'Nenhuma lista ainda' : `${count} ${count === 1 ? 'lista' : 'listas'}`;
  }

  return (
    <div>
      <h1 className="text-3xl font-semibold tracking-tight">
        {getGreeting()}, {profile?.display_name} ❤️
      </h1>
      <p className="mt-3 text-stone-600 dark:text-stone-400">
        {partner
          ? `Seu espaço está conectado com ${partner.display_name}.`
          : 'Seu espaço está pronto.'}
      </p>

      <Link
        to="/listas"
        className="mt-8 flex items-center gap-4 rounded-2xl border border-stone-200 bg-white p-4 transition hover:border-rose-300 dark:border-stone-800 dark:bg-stone-900 dark:hover:border-rose-500/50"
      >
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-100 text-rose-500 dark:bg-rose-500/15">
          <ListChecks className="h-5 w-5" />
        </span>
        <span className="flex-1">
          <span className="block font-medium">Listas</span>
          <span className="block text-sm text-stone-500 dark:text-stone-400">
            {listsSummary}
          </span>
        </span>
        <ChevronRight className="h-4 w-4 text-stone-400" />
      </Link>

      <p className="mt-6 rounded-2xl border border-dashed border-stone-300 p-4 text-sm text-stone-500 dark:border-stone-700 dark:text-stone-400">
        Tarefas, notas, planejamentos e o dashboard completo ainda não foram
        implementados: eles chegam nas próximas fases.
      </p>
    </div>
  );
}