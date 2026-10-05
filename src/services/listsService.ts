import { supabase } from '../lib/supabaseClient';
import type { List } from '../types';

export async function fetchLists(workspaceId: string): Promise<List[]> {
  const { data, error } = await supabase
    .from('lists')
    .select('*')
    .eq('workspace_id', workspaceId)
    .is('deleted_at', null)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data ?? []) as List[];
}

export async function createList(workspaceId: string, title: string): Promise<List> {
  const { data, error } = await supabase
    .from('lists')
    .insert({ workspace_id: workspaceId, title })
    .select()
    .single();
  if (error) throw error;
  return data as List;
}

export async function renameList(id: string, title: string): Promise<List> {
  const { data, error } = await supabase
    .from('lists')
    .update({ title })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as List;
}

// Exclusão "suave": marca deleted_at em vez de apagar a linha.
export async function deleteList(id: string): Promise<void> {
  const { error } = await supabase
    .from('lists')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw error;
}