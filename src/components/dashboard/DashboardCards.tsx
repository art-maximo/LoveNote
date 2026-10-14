import { useMemo } from 'react';
import { CalendarDays, Check, FileText, ListChecks, ListTodo, History } from 'lucide-react';
import { CardBody, DashboardCard, DashboardRow } from './DashboardCard';
import { useActivities } from '../../hooks/useActivities';
import { useAuth } from '../../hooks/useAuth';
import { useItems } from '../../hooks/useListItems';
import { useLists } from '../../hooks/useLists';
import { useNotes } from '../../hooks/useNotes';
import { usePlans } from '../../hooks/usePlans';
import { useTasks } from '../../hooks/useTasks';
import {
  activityIcon,
  activityLink,
  actorLabel,
  describeActivity,
} from '../../lib/activities';
import { getPlanType } from '../../lib/plans/registry';
import { daysUntil, formatDueDate, isOverdue, todayISO } from '../../utils/dates';
import { plural } from '../../utils/plural';
import { formatRelative } from '../../utils/relativeTime';
import { compareTasks } from '../../utils/tasks';

const TASKS_SHOWN = 5;

export function PendingTasksCard() {
  const query = useTasks();
  const tasks = query.data;

  const pending = useMemo(
    () => (tasks ?? []).filter((task) => !task.is_done).sort(compareTasks),
    [tasks],
  );
  const shown = pending.slice(0, TASKS_SHOWN);
  const hidden = pending.length - shown.length;

  return (
    <DashboardCard title="Tarefas pendentes" icon={ListTodo} to="/tarefas">
      <CardBody
        isPending={query.isPending}
        isError={query.isError}
        error={query.error}
        onRetry={() => void query.refetch()}
        empty={pending.length === 0}
        emptyText="Nenhuma tarefa pendente. Tudo em dia!"
      >
        <ul className="space-y-0.5">
          {shown.map((task) => {
            const overdue = isOverdue(task.due_date, task.is_done);
            return (
              <DashboardRow key={task.id} to="/tarefas">
                <span className="min-w-0 flex-1 truncate text-sm">{task.title}</span>
                {task.priority === 'high' && (
                  <span className="shrink-0 rounded-md bg-rose-100 px-1.5 py-0.5 text-xs font-medium text-rose-700 dark:bg-rose-500/15 dark:text-rose-300">
                    Alta
                  </span>
                )}
                {task.due_date && (
                  <span
                    className={`shrink-0 text-xs ${
                      overdue
                        ? 'font-medium text-red-600 dark:text-red-400'
                        : 'text-stone-500 dark:text-stone-400'
                    }`}
                  >
                    {formatDueDate(task.due_date)}
                  </span>
                )}
              </DashboardRow>
            );
          })}
          {hidden > 0 && (
            <li className="px-2 pt-1 text-xs text-stone-400">
              + {plural(hidden, 'outra', 'outras')}
            </li>
          )}
        </ul>
      </CardBody>
    </DashboardCard>
  );
}

export function RecentDoneCard() {
  const query = useTasks();
  const tasks = query.data;

  const done = useMemo(
    () =>
      (tasks ?? [])
        .filter((task) => task.is_done && task.completed_at !== null)
        .sort((a, b) => (b.completed_at ?? '').localeCompare(a.completed_at ?? ''))
        .slice(0, TASKS_SHOWN),
    [tasks],
  );

  return (
    <DashboardCard title="Concluídas recentemente" icon={Check} to="/tarefas">
      <CardBody
        isPending={query.isPending}
        isError={query.isError}
        error={query.error}
        onRetry={() => void query.refetch()}
        empty={done.length === 0}
        emptyText="Nenhuma tarefa concluída ainda."
      >
        <ul className="space-y-0.5">
          {done.map((task) => (
            <DashboardRow key={task.id} to="/tarefas">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-rose-500 text-white">
                <Check className="h-3 w-3" strokeWidth={3} />
              </span>
              <span className="min-w-0 flex-1 truncate text-sm text-stone-500 dark:text-stone-400">
                {task.title}
              </span>
              {task.completed_at && (
                <span className="shrink-0 text-xs text-stone-400">
                  {formatRelative(task.completed_at)}
                </span>
              )}
            </DashboardRow>
          ))}
        </ul>
      </CardBody>
    </DashboardCard>
  );
}

export function UpcomingPlansCard() {
  const query = usePlans();
  const plans = query.data;

  const upcoming = useMemo(() => {
    const today = todayISO();
    return (plans ?? [])
      .filter((plan) => plan.starts_on !== null && plan.starts_on >= today)
      .sort((a, b) => (a.starts_on ?? '').localeCompare(b.starts_on ?? ''))
      .slice(0, 4);
  }, [plans]);

  return (
    <DashboardCard title="Próximos planejamentos" icon={CalendarDays} to="/planos">
      <CardBody
        isPending={query.isPending}
        isError={query.isError}
        error={query.error}
        onRetry={() => void query.refetch()}
        empty={upcoming.length === 0}
        emptyText="Nenhum planejamento com data próxima."
      >
        <ul className="space-y-0.5">
          {upcoming.map((plan) => {
            const Icon = getPlanType(plan.type)?.icon ?? CalendarDays;
            const days = plan.starts_on ? daysUntil(plan.starts_on) : 0;
            const when = days === 0 ? 'hoje' : days === 1 ? 'amanhã' : `em ${days} dias`;
            return (
              <DashboardRow key={plan.id} to={`/planos/${plan.id}`}>
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-rose-100 text-rose-500 dark:bg-rose-500/15">
                  <Icon className="h-4 w-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm">{plan.title}</span>
                  <span className="block truncate text-xs text-stone-500 dark:text-stone-400">
                    {plan.starts_on ? formatDueDate(plan.starts_on) : ''} · {when}
                  </span>
                </span>
              </DashboardRow>
            );
          })}
        </ul>
      </CardBody>
    </DashboardCard>
  );
}

export function RecentListsCard() {
  const listsQuery = useLists();
  const itemsQuery = useItems();
  const lists = listsQuery.data;
  const items = itemsQuery.data;

  // Ordena pela última mexida, que inclui a mudança nos itens da lista.
  const rows = useMemo(() => {
    const stats = new Map<string, { total: number; done: number; touched: string }>();
    for (const item of items ?? []) {
      const current = stats.get(item.list_id) ?? { total: 0, done: 0, touched: '' };
      current.total += 1;
      if (item.is_done) current.done += 1;
      if (item.updated_at > current.touched) current.touched = item.updated_at;
      stats.set(item.list_id, current);
    }
    return (lists ?? [])
      .map((list) => {
        const stat = stats.get(list.id);
        const touched = stat && stat.touched > list.updated_at ? stat.touched : list.updated_at;
        return { list, total: stat?.total ?? 0, done: stat?.done ?? 0, touched };
      })
      .sort((a, b) => b.touched.localeCompare(a.touched))
      .slice(0, 4);
  }, [lists, items]);

  return (
    <DashboardCard title="Listas recentes" icon={ListChecks} to="/listas">
      <CardBody
        isPending={listsQuery.isPending || itemsQuery.isPending}
        isError={listsQuery.isError || itemsQuery.isError}
        error={listsQuery.error ?? itemsQuery.error}
        onRetry={() => {
          void listsQuery.refetch();
          void itemsQuery.refetch();
        }}
        empty={rows.length === 0}
        emptyText="Nenhuma lista ainda."
      >
        <ul className="space-y-0.5">
          {rows.map(({ list, total, done }) => (
            <DashboardRow key={list.id} to={`/listas/${list.id}`}>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm">{list.title}</span>
                <span className="block text-xs text-stone-500 dark:text-stone-400">
                  {total === 0 ? 'Sem itens' : `${done} de ${total} concluídos`}
                </span>
              </span>
              {total > 0 && (
                <span className="h-1.5 w-16 shrink-0 overflow-hidden rounded-full bg-stone-100 dark:bg-stone-800">
                  <span
                    className="block h-full rounded-full bg-rose-400"
                    style={{ width: `${Math.round((done / total) * 100)}%` }}
                  />
                </span>
              )}
            </DashboardRow>
          ))}
        </ul>
      </CardBody>
    </DashboardCard>
  );
}

export function RecentNotesCard() {
  const query = useNotes();
  const { profile, partner } = useAuth();
  const notes = query.data;

  const recent = useMemo(
    () =>
      [...(notes ?? [])]
        .sort((a, b) => b.updated_at.localeCompare(a.updated_at))
        .slice(0, 4),
    [notes],
  );

  return (
    <DashboardCard title="Anotações recentes" icon={FileText} to="/notas">
      <CardBody
        isPending={query.isPending}
        isError={query.isError}
        error={query.error}
        onRetry={() => void query.refetch()}
        empty={recent.length === 0}
        emptyText="Nenhuma anotação ainda."
      >
        <ul className="space-y-0.5">
          {recent.map((note) => {
            const snippet = note.content.replace(/\s+/g, ' ').trim().slice(0, 80);
            return (
              <DashboardRow key={note.id} to={`/notas/${note.id}`}>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm">
                    {note.title.trim() === '' ? 'Sem título' : note.title}
                  </span>
                  <span className="block truncate text-xs text-stone-500 dark:text-stone-400">
                    {snippet === '' ? 'Anotação vazia' : snippet}
                  </span>
                </span>
                <span className="shrink-0 text-right text-xs text-stone-400">
                  {formatRelative(note.updated_at)}
                  <br />
                  {actorLabel(note.updated_by, profile, partner)}
                </span>
              </DashboardRow>
            );
          })}
        </ul>
      </CardBody>
    </DashboardCard>
  );
}

export function RecentActivityCard() {
  const query = useActivities();
  const { profile, partner } = useAuth();
  const activities = (query.data ?? []).slice(0, 8);

  return (
    <DashboardCard title="Atividades recentes" icon={History}>
      <CardBody
        isPending={query.isPending}
        isError={query.isError}
        error={query.error}
        onRetry={() => void query.refetch()}
        empty={activities.length === 0}
        emptyText="Nenhuma atividade ainda. Crie uma tarefa, lista ou anotação!"
      >
        <ul className="space-y-0.5">
          {activities.map((activity) => {
            const Icon = activityIcon(activity.entity_type);
            return (
              <DashboardRow key={activity.id} to={activityLink(activity)}>
                <Icon className="h-4 w-4 shrink-0 text-stone-400" />
                <span className="line-clamp-2 min-w-0 flex-1 text-sm">
                  <span className="font-medium">
                    {actorLabel(activity.actor_id, profile, partner)}
                  </span>{' '}
                  {describeActivity(activity)}
                </span>
                <span className="shrink-0 text-xs text-stone-400">
                  {formatRelative(activity.created_at)}
                </span>
              </DashboardRow>
            );
          })}
        </ul>
      </CardBody>
    </DashboardCard>
  );
}