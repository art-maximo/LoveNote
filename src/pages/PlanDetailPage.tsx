import { Link, useParams } from 'react-router-dom';
import { CalendarDays } from 'lucide-react';
import { PlanEditor } from '../components/plans/PlanEditor';
import { EmptyState } from '../components/ui/EmptyState';
import { ErrorState } from '../components/ui/ErrorState';
import { Skeleton } from '../components/ui/Skeleton';
import { usePlans } from '../hooks/usePlans';
import { friendlyError } from '../lib/errors';

export function PlanDetailPage() {
  const { planId } = useParams<{ planId: string }>();
  const plansQuery = usePlans();

  if (plansQuery.isPending) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (plansQuery.isError) {
    return (
      <ErrorState
        message={friendlyError(plansQuery.error, 'Não foi possível carregar o planejamento.')}
        onRetry={() => void plansQuery.refetch()}
      />
    );
  }

  const plan = plansQuery.data.find((entry) => entry.id === planId);

  if (!plan) {
    return (
      <EmptyState
        icon={CalendarDays}
        title="Planejamento não encontrado"
        description="Ele pode ter sido excluído ou o link está incorreto."
      >
        <Link
          to="/planos"
          className="rounded-xl bg-rose-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-rose-600"
        >
          Ver todos os planejamentos
        </Link>
      </EmptyState>
    );
  }

  // A chave reinicia o editor ao trocar de planejamento.
  return <PlanEditor key={plan.id} plan={plan} />;
}