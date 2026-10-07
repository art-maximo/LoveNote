import { supabase } from '../lib/supabaseClient';
import type { Note } from '../types';

export async function fetchNotes(workspaceId: string): Promise<Note[]> {
  const { data, error } = await supabase
    .from('notes')
    .select('*')
    .eq('workspace_id', workspaceId)
    .is('deleted_at', null)
    .order('updated_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as Note[];
}

interface CreateNoteInput {
  workspaceId: string;
  title?: string;
  content?: string;
}

// Autor e último editor são carimbados pelo banco.
export async function createNote(input: CreateNoteInput): Promise<Note> {
  const { data, error } = await supabase
    .from('notes')
    .insert({
      workspace_id: input.workspaceId,
      title: input.title ?? 'Sem título',
      content: input.content ?? '',
    })
    .select()
    .single();
  if (error) throw error;
  return data as Note;
}

// Exclusão "suave": marca deleted_at em vez de apagar a linha.
// (Editar passa por services/versionedUpdate.ts.)
export async function deleteNote(id: string): Promise<void> {
  const { error } = await supabase
    .from('notes')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw error;
}