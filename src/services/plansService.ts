import { supabase } from '../lib/supabaseClient';
import type { Plan } from '../types';

export async function fetchPlans(workspaceId: string): Promise<Plan[]> {
  const { data, error } = await supabase
    .from('plans')
    .select('*')
    .eq('workspace_id', workspaceId)
    .is('deleted_at', null)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data ?? []) as Plan[];
}

interface CreatePlanInput {
  workspaceId: string;
  type: string;
  title: string;
  data: Record<string, unknown>;
  startsOn: string | null;
}

// Autor e último editor são carimbados pelo banco.
export async function createPlan(input: CreatePlanInput): Promise<Plan> {
  const { data: row, error } = await supabase
    .from('plans')
    .insert({
      workspace_id: input.workspaceId,
      type: input.type,
      title: input.title,
      data: input.data,
      starts_on: input.startsOn,
    })
    .select()
    .single();
  if (error) throw error;
  return row as Plan;
}

// Exclusão "suave": marca deleted_at em vez de apagar a linha.
// (Editar passa por services/planUpdate.ts.)
export async function deletePlan(id: string): Promise<void> {
  const { error } = await supabase
    .from('plans')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw error;
}