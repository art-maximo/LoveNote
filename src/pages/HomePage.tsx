import { Link } from 'react-router-dom';
import { ChevronRight, ListChecks, ListTodo } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useLists } from '../hooks/useLists';
import { useTasks } from '../hooks/useTasks';
import { isOverdue } from '../utils/dates';
import { getGreeting } from '../utils/greeting';

interface SummaryCardProps {
  to: string;
  icon: LucideIcon;
  title: string;
  summary: string;
}

function SummaryCard({ to, icon: Icon, title, summary }: SummaryCardProps) {
  return (
    <Link
      to={to}
      className="flex items-center gap-4 rounded-2xl border border-stone-200 bg-white p-4 transition hover:border-rose-300 dark:border-stone-800 dark:bg-stone-900 dark:hover:border-rose-500/50"
    >
      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-100 text-rose-500 dark:bg-rose-500/15">
        <Icon className="h-5 w-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-medium">{title}</span>
        <span className="block truncate text-sm text-stone-500 dark:text-stone-400">
          {summary}
        </span>
      </span>
      <ChevronRight className="h-4 w-4 shrink-0 text-stone-400" />
    </Link>
  );
}

export function HomePage() {
  const { profile, partner } = useAuth();
  const listsQuery = useLists();
  const tasksQuery = useTasks();

  const listCount = listsQuery.data?.length;
  let listsSummary = 'Carregando...';
  if (listCount !== undefined) {
    listsSummary =
      listCount === 0
        ? 'Nenhuma lista ainda'
        : `${listCount} ${listCount === 1 ? 'lista' : 'listas'}`;
  }

  const tasks = tasksQuery.data;
  let tasksSummary = 'Carregando...';
  if (tasks) {
    const pending = tasks.filter((task) => !task.is_done);
    const overdue = pending.filter((task) => isOverdue(task.due_date, task.is_done)).length;
    if (pending.length === 0) {
      tasksSummary = 'Nenhuma pendente';
    } else {
      tasksSummary = `${pending.length} ${pending.length === 1 ? 'pendente' : 'pendentes'}`;
      if (overdue > 0) {
        tasksSummary += ` · ${overdue} ${overdue === 1 ? 'atrasada' : 'atrasadas'}`;
      }
    }
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

      <div className="mt-8 grid gap-3 sm:grid-cols-2">
        <SummaryCard to="/tarefas" icon={ListTodo} title="Tarefas" summary={tasksSummary} />
        <SummaryCard to="/listas" icon={ListChecks} title="Listas" summary={listsSummary} />
      </div>

      <p className="mt-6 rounded-2xl border border-dashed border-stone-300 p-4 text-sm text-stone-500 dark:border-stone-700 dark:text-stone-400">
        Notas, planejamentos e o dashboard completo ainda não foram implementados:
        eles chegam nas próximas fases.
      </p>
    </div>
  );
}