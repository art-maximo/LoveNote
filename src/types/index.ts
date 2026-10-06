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

export type TaskPriority = 'low' | 'medium' | 'high';

// Linha da tabela public.tasks
export interface Task {
  id: string;
  workspace_id: string;
  title: string;
  description: string | null;
  is_done: boolean;
  completed_at: string | null;
  priority: TaskPriority;
  due_date: string | null; // formato AAAA-MM-DD
  assignee_id: string | null;
  allow_partner_edit: boolean;
  created_by: string | null;
  deleted_at: string | null;
  version: number;
  created_at: string;
  updated_at: string;
}

// Campos de uma tarefa que o app pode alterar
export type TaskChanges = Partial<
  Pick<
    Task,
    | 'title'
    | 'description'
    | 'is_done'
    | 'priority'
    | 'due_date'
    | 'assignee_id'
    | 'allow_partner_edit'
  >
>;