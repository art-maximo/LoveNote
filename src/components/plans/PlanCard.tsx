import { Link } from 'react-router-dom';
import { CalendarDays } from 'lucide-react';
import { getPlanType } from '../../lib/plans/registry';
import type { Plan } from '../../types';
import { formatDateTime } from '../../utils/dates';

interface PlanCardProps {
  plan: Plan;
  // Nome de quem fez a última edição ("você", "Maria"...)
  editorName: string;
}

export function PlanCard({ plan, editorName }: PlanCardProps) {
  const info = getPlanType(plan.type);
  const Icon = info ? info.icon : CalendarDays;
  const summary = info ? info.summary(plan) : 'Tipo de planejamento não suportado nesta versão';
  const title = plan.title.trim() === '' ? 'Sem título' : plan.title;

  return (
    <Link
      to={`/planos/${plan.id}`}
      className="flex items-start gap-3 rounded-2xl border border-stone-200 bg-white p-4 transition hover:border-rose-300 hover:shadow-sm focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-rose-200 dark:border-stone-800 dark:bg-stone-900 dark:hover:border-rose-500/50 dark:focus-visible:ring-rose-400/30"
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-100 text-rose-500 dark:bg-rose-500/15">
        <Icon className="h-5 w-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-medium">{title}</span>
        <span className="mt-0.5 block truncate text-sm text-stone-500 dark:text-stone-400">
          {info ? `${info.label} · ` : ''}
          {summary}
        </span>
        <span className="mt-2 block text-xs text-stone-400 dark:text-stone-500">
          {formatDateTime(plan.updated_at)} · {editorName}
        </span>
      </span>
    </Link>
  );
}