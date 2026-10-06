import { supabase } from '../lib/supabaseClient';
import type { ListItem } from '../types';

export async function fetchItems(workspaceId: string): Promise<ListItem[]> {
  const { data, error } = await supabase
    .from('list_items')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('position', { ascending: true });
  if (error) throw error;
  return (data ?? []) as ListItem[];
}

interface CreateItemInput {
  workspaceId: string;
  listId: string;
  text: string;
}

// A posição (fim da lista) é definida pelo próprio banco.
export async function createItem(input: CreateItemInput): Promise<ListItem> {
  const { data, error } = await supabase
    .from('list_items')
    .insert({
      workspace_id: input.workspaceId,
      list_id: input.listId,
      text: input.text,
    })
    .select()
    .single();
  if (error) throw error;
  return data as ListItem;
}

// (Editar passa por services/versionedUpdate.ts.)
export async function deleteItem(id: string): Promise<void> {
  const { error } = await supabase.from('list_items').delete().eq('id', id);
  if (error) throw error;
}

// Recria um item apagado (botão "Desfazer").
export async function restoreItem(item: ListItem): Promise<ListItem> {
  const { data, error } = await supabase
    .from('list_items')
    .insert({
      id: item.id,
      workspace_id: item.workspace_id,
      list_id: item.list_id,
      text: item.text,
      note: item.note,
      is_done: item.is_done,
      position: item.position,
    })
    .select()
    .single();
  if (error) throw error;
  return data as ListItem;
}