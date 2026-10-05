// Linha da tabela public.profiles
export interface Profile {
  id: string;
  username: string;
  display_name: string;
  created_at: string;
  updated_at: string;
}

// Linha da tabela public.lists
export interface List {
  id: string;
  workspace_id: string;
  title: string;
  created_by: string | null;
  deleted_at: string | null;
  version: number;
  created_at: string;
  updated_at: string;
}

// Linha da tabela public.list_items
export interface ListItem {
  id: string;
  list_id: string;
  workspace_id: string;
  text: string;
  note: string | null;
  is_done: boolean;
  position: number;
  created_by: string | null;
  version: number;
  created_at: string;
  updated_at: string;
}

// Campos de um item que o app pode alterar
export type ItemChanges = Partial<Pick<ListItem, 'text' | 'note' | 'is_done' | 'position'>>;