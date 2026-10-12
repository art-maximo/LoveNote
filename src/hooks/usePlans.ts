import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { applyServerRow, removeFromCache } from '../lib/cacheSync';
import { notifyConflict } from '../lib/conflicts';
import { friendlyError } from '../lib/errors';
import { applyPlanPatch } from '../lib/plans/patch';
import type { PlanPatch } from '../lib/plans/patch';
import { planKeyLabel, planValueText } from '../lib/plans/registry';
import type { PlanTypeInfo } from '../lib/plans/registry';
import { queryKeys } from '../lib/queryKeys';
import { runSerial } from '../lib/rowQueue';
import { createPlan, deletePlan, fetchPlans } from '../services/plansService';
import { updatePlanVersioned } from '../services/planUpdate';
import type { PlanUpdateOutcome } from '../services/planUpdate';
import type { Plan } from '../types';
import { upsertById } from '../utils/cache';
import { assertOnline } from '../utils/network';
import { useAuth } from './useAuth';
import { useWorkspaceId } from './useWorkspaceId';

export function usePlans() {
  const workspaceId = useWorkspaceId();
  return useQuery({
    queryKey: queryKeys.plans(workspaceId),
    queryFn: () => fetchPlans(workspaceId),
  });
}

export function useCreatePlan() {
  const queryClient = useQueryClient();
  const workspaceId = useWorkspaceId();
  const cacheKey = queryKeys.plans(workspaceId);

  return useMutation({
    mutationFn: async (info: PlanTypeInfo) => {
      assertOnline();
      return createPlan({
        workspaceId,
        type: info.id,
        title: info.defaultTitle,
        data: info.initialData(),
        startsOn: null,
      });
    },
    onSuccess: (row) => {
      queryClient.setQueryData<Plan[]>(cacheKey, (old) => upsertById(old, row));
    },
    onError: (error) => {
      toast.error(friendlyError(error, 'Não foi possível criar o planejamento.'));
    },
  });
}

interface UpdateVariables {
  // O planejamento como estava quando a pessoa começou a editar.
  base: Plan;
  patch: PlanPatch;
  // Grava mesmo que a outra pessoa tenha mexido na mesma coisa.
  force?: boolean;
}

// "title" ou "data.<chave>" -> valor da minha alteração / da versão do servidor
function mineValue(patch: PlanPatch, key: string): unknown {
  if (key === 'title') return patch.title;
  return patch.data?.[key.slice('data.'.length)];
}

function serverValue(server: Plan, key: string): unknown {
  if (key === 'title') return server.title;
  return server.data[key.slice('data.'.length)];
}

export function useUpdatePlan() {
  const queryClient = useQueryClient();
  const workspaceId = useWorkspaceId();
  const { partner } = useAuth();
  const cacheKey = queryKeys.plans(workspaceId);
  const partnerName = partner?.display_name ?? 'A outra pessoa';

  function save(base: Plan, patch: PlanPatch, force: boolean): Promise<PlanUpdateOutcome> {
    return runSerial(base.id, () => updatePlanVersioned(base, patch, { force }));
  }

  function applyOptimistic(id: string, patch: PlanPatch): void {
    queryClient.setQueryData<Plan[]>(cacheKey, (old) =>
      (old ?? []).map((plan) => (plan.id === id ? applyPlanPatch(plan, patch) : plan)),
    );
  }

  function handleOutcome(outcome: PlanUpdateOutcome, base: Plan, patch: PlanPatch): void {
    if (outcome.status === 'ok') {
      applyServerRow(queryClient, cacheKey, outcome.row);
      return;
    }
    if (outcome.status === 'gone') {
      removeFromCache(queryClient, cacheKey, base.id);
      toast.info(`${partnerName} excluiu este planejamento.`);
      return;
    }
    // Conflito: a versão da outra pessoa fica na tela e a pessoa escolhe.
    const { server, key } = outcome;
    applyServerRow(queryClient, cacheKey, server);
    notifyConflict({
      partnerName,
      field: key,
      fieldLabel: planKeyLabel(server.type, key),
      mine: planValueText(server.type, mineValue(patch, key)),
      theirs: planValueText(server.type, serverValue(server, key)),
      onUseMine: () => {
        void forceMine(server, patch);
      },
    });
  }

  async function forceMine(server: Plan, patch: PlanPatch): Promise<void> {
    try {
      assertOnline();
      applyOptimistic(server.id, patch);
      const outcome = await save(server, patch, true);
      handleOutcome(outcome, server, patch);
    } catch (error) {
      toast.error(friendlyError(error, 'Não foi possível salvar a sua versão.'));
      void queryClient.invalidateQueries({ queryKey: cacheKey });
    }
  }

  return useMutation({
    mutationFn: ({ base, patch, force }: UpdateVariables) => save(base, patch, force ?? false),
    // Atualização otimista: a tela muda na hora.
    onMutate: async ({ base, patch }) => {
      assertOnline();
      await queryClient.cancelQueries({ queryKey: cacheKey });
      applyOptimistic(base.id, patch);
    },
    onSuccess: (outcome, { base, patch }) => {
      handleOutcome(outcome, base, patch);
    },
    onError: (error) => {
      toast.error(friendlyError(error, 'Não foi possível salvar a alteração.'));
      void queryClient.invalidateQueries({ queryKey: cacheKey });
    },
  });
}

export function useDeletePlan() {
  const queryClient = useQueryClient();
  const workspaceId = useWorkspaceId();
  const cacheKey = queryKeys.plans(workspaceId);

  return useMutation({
    mutationFn: async (id: string) => {
      assertOnline();
      await deletePlan(id);
    },
    onSuccess: (_data, id) => {
      removeFromCache(queryClient, cacheKey, id);
      toast.success('Planejamento excluído.');
    },
    onError: (error) => {
      toast.error(friendlyError(error, 'Não foi possível excluir o planejamento.'));
    },
  });
}