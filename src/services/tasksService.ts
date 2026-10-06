import { supabase } from '../lib/supabaseClient';
import type { Task } from '../types';

export async function fetchTasks(workspaceId: string): Promise<Task[]> {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('workspace_id', workspaceId)
    .is('deleted_at', null)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data ?? []) as Task[];
}

// Prioridade média, "pendente" e "só o criador edita" são os padrões do banco.
export async function createTask(workspaceId: string, title: string): Promise<Task> {
  const { data, error } = await supabase
    .from('tasks')
    .insert({ workspace_id: workspaceId, title })
    .select()
    .single();
  if (error) throw error;
  return data as Task;
}

// Exclusão "suave": marca deleted_at em vez de apagar a linha.
// (Editar passa por services/versionedUpdate.ts.)
export async function deleteTask(id: string): Promise<void> {
  const { data, error } = await supabase
    .from('tasks')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)
    .select('id');
  if (error) throw error;

  // Quando o RLS bloqueia, o banco não dá erro: apenas não altera nenhuma linha.
  if (!data || data.length === 0) {
    throw Object.assign(new Error('forbidden'), { code: '42501' });
  }
}

// Desfaz a exclusão (botão "Desfazer").
export async function restoreTask(id: string): Promise<Task> {
  const { data, error } = await supabase
    .from('tasks')
    .update({ deleted_at: null })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as Task;
}