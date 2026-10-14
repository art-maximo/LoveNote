import {
  PendingTasksCard,
  RecentActivityCard,
  RecentDoneCard,
  RecentListsCard,
  RecentNotesCard,
  UpcomingPlansCard,
} from '../components/dashboard/DashboardCards';
import { useActivities } from '../hooks/useActivities';
import { useAuth } from '../hooks/useAuth';
import { usePlans } from '../hooks/usePlans';
import { useTasks } from '../hooks/useTasks';
import { actorLabel, describeActivity } from '../lib/activities';
import { isOverdue, todayISO } from '../utils/dates';
import { getGreeting } from '../utils/greeting';
import { plural } from '../utils/plural';
import { formatRelative } from '../utils/relativeTime';

// "Vocês têm 7 tarefas pendentes e 2 planejamentos próximos. 2 estão atrasadas."
function buildSummary(pending: number, overdue: number, upcoming: number): string {
  const parts: string[] = [];
  if (pending > 0) parts.push(plural(pending, 'tarefa pendente', 'tarefas pendentes'));
  if (upcoming > 0) {
    parts.push(plural(upcoming, 'planejamento próximo', 'planejamentos próximos'));
  }
  if (parts.length === 0) return 'Tudo em dia por aqui.';

  let text = `Vocês têm ${parts.join(' e ')}.`;
  if (overdue > 0) text += ` ${plural(overdue, 'está atrasada', 'estão atrasadas')}.`;
  return text;
}

export function HomePage() {
  const { profile, partner } = useAuth();
  const tasksQuery = useTasks();
  const plansQuery = usePlans();
  const activitiesQuery = useActivities();

  const tasks = tasksQuery.data;
  const plans = plansQuery.data;

  let summary = 'Carregando...';
  if (tasks && plans) {
    const today = todayISO();
    const pending = tasks.filter((task) => !task.is_done);
    const overdue = pending.filter((task) => isOverdue(task.due_date, task.is_done)).length;
    const upcoming = plans.filter(
      (plan) => plan.starts_on !== null && plan.starts_on >= today,
    ).length;
    summary = buildSummary(pending.length, overdue, upcoming);
  }

  const lastActivity = activitiesQuery.data?.[0];

  return (
    <div>
      <h1 className="text-3xl font-semibold tracking-tight">
        {getGreeting()}, {profile?.display_name} ❤️
      </h1>
      <p className="mt-3 text-stone-600 dark:text-stone-400">{summary}</p>

      {lastActivity && (
        <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
          <span className="font-medium text-stone-600 dark:text-stone-300">Última atividade:</span>{' '}
          {actorLabel(lastActivity.actor_id, profile, partner)}{' '}
          {describeActivity(lastActivity)} · {formatRelative(lastActivity.created_at)}
        </p>
      )}

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <PendingTasksCard />
        <UpcomingPlansCard />
        <RecentDoneCard />
        <RecentListsCard />
        <RecentNotesCard />
        <RecentActivityCard />
      </div>
    </div>
  );
}