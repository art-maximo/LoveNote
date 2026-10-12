import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarDays, Plus, X } from 'lucide-react';
import { PlanCard } from '../components/plans/PlanCard';
import { EmptyState } from '../components/ui/EmptyState';
import { ErrorState } from '../components/ui/ErrorState';
import { Skeleton } from '../components/ui/Skeleton';
import { useAuth } from '../hooks/useAuth';
import { useCreatePlan, usePlans } from '../hooks/usePlans';
import { friendlyError } from '../lib/errors';
import { PLAN_TYPES } from '../lib/plans/registry';
import type { PlanTypeInfo } from '../lib/plans/registry';
import type { Plan } from '../types';
import { todayISO } from '../utils/dates';

// Próximos primeiro (por data), depois sem data (mais recentes), depois os já passados.
function rank(plan: Plan, today: string): number {
  if (!plan.starts_on) return 1;
  return plan.starts_on >= today ? 0 : 2;
}

function comparePlans(a: Plan, b: Plan, today: string): number {
  const rankA = rank(a, today);
  const rankB = rank(b, today);
  if (rankA !== rankB) return rankA - rankB;
  if (rankA === 0) return (a.starts_on ?? '').localeCompare(b.starts_on ?? '');
  if (rankA === 2) return (b.starts_on ?? '').localeCompare(a.starts_on ?? '');
  return b.updated_at.localeCompare(a.updated_at);
}

export function PlansPage() {
  const navigate = useNavigate();
  const { profile, partner } = useAuth();
  const plansQuery = usePlans();
  const createPlan = useCreatePlan();
  const [picking, setPicking] = useState(false);

  const plans = plansQuery.data;

  const sorted = useMemo(() => {
    const today = todayISO();
    return [...(plans ?? [])].sort((a, b) => comparePlans(a, b, today));
  }, [plans]);

  function editorName(id: string | null): string {
    if (id && id === profile?.id) return 'você';
    if (id && id === partner?.id) return partner.display_name;
    return 'alguém';
  }

  function handlePick(info: PlanTypeInfo) {
    createPlan.mutate(info, {
      onSuccess: (plan) => navigate(`/planos/${plan.id}`),
    });
  }

  return (
    <div>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Planejamentos</h1>
          <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
            Viagens, semanas e tudo que vocês querem combinar com antecedência.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setPicking((open) => !open)}
          className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-rose-500 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-rose-600"
        >
          {picking ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {picking ? 'Fechar' : 'Novo'}
        </button>
      </div>

      {picking && (
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {PLAN_TYPES.map((info) => {
            const Icon = info.icon;
            return (
              <button
                key={info.id}
                type="button"
                disabled={createPlan.isPending}
                onClick={() => handlePick(info)}
                className="flex items-start gap-3 rounded-2xl border border-stone-200 bg-white p-4 text-left transition hover:border-rose-300 disabled:cursor-not-allowed disabled:opacity-60 dark:border-stone-800 dark:bg-stone-900 dark:hover:border-rose-500/50"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-100 text-rose-500 dark:bg-rose-500/15">
                  <Icon className="h-5 w-5" />
                </span>
                <span>
                  <span className="block font-medium">{info.label}</span>
                  <span className="mt-0.5 block text-sm text-stone-500 dark:text-stone-400">
                    {info.description}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      )}

      <div className="mt-6">
        {plansQuery.isPending ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
          </div>
        ) : plansQuery.isError ? (
          <ErrorState
            message={friendlyError(plansQuery.error, 'Não foi possível carregar os planejamentos.')}
            onRetry={() => void plansQuery.refetch()}
          />
        ) : sorted.length === 0 ? (
          <EmptyState
            icon={CalendarDays}
            title="Nenhum planejamento ainda"
            description="Clique em Novo para planejar uma viagem ou a semana de vocês."
          />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {sorted.map((plan) => (
              <PlanCard key={plan.id} plan={plan} editorName={editorName(plan.updated_by)} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}