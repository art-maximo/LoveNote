import { supabase } from '../lib/supabaseClient';
import type { Activity } from '../types/activity';

// As atividades mais recentes do workspace (da mais nova para a mais antiga).
export async function fetchActivities(workspaceId: string, limit = 30): Promise<Activity[]> {
  const { data, error } = await supabase
    .from('activities')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as Activity[];
}