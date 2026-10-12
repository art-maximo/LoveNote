import { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Trash2 } from 'lucide-react';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { LiveField } from '../ui/LiveField';
import { TripEditor } from './TripEditor';
import { WeeklyEditor } from './WeeklyEditor';
import { useAuth } from '../../hooks/useAuth';
import { useConnection } from '../../hooks/useConnection';
import { useDeletePlan, useUpdatePlan } from '../../hooks/usePlans';
import { useViewing } from '../../hooks/useViewing';
import type { PlanPatch } from '../../lib/plans/patch';
import { getPlanType } from '../../lib/plans/registry';
import type { Plan } from '../../types';
import { formatDateTime } from '../../utils/dates';

interface PlanEditorProps {
  plan: Plan;
}

export function PlanEditor({ plan }: PlanEditorProps) {
  const navigate = useNavigate();
  const { profile, partner } = useAuth();
  const { partnerViewing } = useConnection();
  const updatePlan = useUpdatePlan();
  const deletePlan = useDeletePlan();
  useViewing(`plan:${plan.id}`);

  const info = getPlanType(plan.type);
  const [confirmOpen, setConfirmOpen] = useState(false);
  // O planejamento como estava quando a pessoa começou a editar o título.
  const titleBaseRef = useRef<Plan>(plan);

  function onPatch(base: Plan, patch: PlanPatch, force?: boolean) {
    updatePlan.mutate({ base, patch, force });
  }

  function nameOf(id: string | null): string {
    if (!id) return 'alguém';
    if (id === profile?.id) return 'você';
    if (id === partner?.id) return partner.display_name;
    return 'alguém';
  }

  const partnerHere = partner !== null && partnerViewing === `plan:${plan.id}`;
  const Icon = info?.icon;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-3">
        <Link
          to="/planos"
          className="inline-flex items-center gap-1 text-sm text-stone-500 transition hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-200"
        >
          <ArrowLeft className="h-4 w-4" />
          Planejamentos
        </Link>
        <button
          type="button"
          onClick={() => setConfirmOpen(true)}
          aria-label="Excluir planejamento"
          title="Excluir planejamento"
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-stone-400 transition hover:bg-stone-200/70 hover:text-rose-600 dark:hover:bg-stone-800"
        >
          <Trash2 className="h-5 w-5" />
        </button>
      </div>

      {partnerHere && partner && (
        <p className="mb-4 inline-flex items-center gap-2 rounded-full bg-violet-100 px-3 py-1 text-xs font-medium text-violet-700 dark:bg-violet-500/15 dark:text-violet-300">
          <span className="h-2 w-2 rounded-full bg-emerald-500" aria-hidden="true" />
          {partner.display_name} está com este planejamento aberto
        </p>
      )}

      {info && Icon && (
        <p className="mb-1 inline-flex items-center gap-1.5 text-xs font-medium text-rose-600 dark:text-rose-400">
          <Icon className="h-3.5 w-3.5" />
          {info.label}
        </p>
      )}

      <LiveField
        ariaLabel="Título do planejamento"
        value={plan.title}
        maxLength={200}
        className="text-2xl font-semibold tracking-tight"
        onFocusStart={() => {
          titleBaseRef.current = plan;
        }}
        onCommit={(title) => onPatch(titleBaseRef.current, { title })}
      />

      <div className="mt-6">
        {plan.type === 'trip' && <TripEditor plan={plan} onPatch={onPatch} />}
        {plan.type === 'weekly' && <WeeklyEditor plan={plan} onPatch={onPatch} />}
        {!info && (
          <p className="rounded-2xl border border-dashed border-stone-300 p-4 text-sm text-stone-500 dark:border-stone-700 dark:text-stone-400">
            Este tipo de planejamento não é suportado nesta versão do app.
          </p>
        )}
      </div>

      <p className="mt-8 border-t border-stone-200 pt-4 text-xs text-stone-500 dark:border-stone-800 dark:text-stone-400">
        Criado por {nameOf(plan.created_by)} em {formatDateTime(plan.created_at)}
        <br />
        Última edição por {nameOf(plan.updated_by)} em {formatDateTime(plan.updated_at)}
      </p>

      <ConfirmDialog
        open={confirmOpen}
        title="Excluir planejamento"
        message={`Tem certeza que deseja excluir "${plan.title.trim() || 'Sem título'}"?`}
        confirmLabel="Excluir"
        loading={deletePlan.isPending}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() =>
          deletePlan.mutate(plan.id, {
            onSuccess: () => navigate('/planos', { replace: true }),
            onSettled: () => setConfirmOpen(false),
          })
        }
      />
    </div>
  );
}