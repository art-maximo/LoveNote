// Linha da tabela public.activities (escrita só pelos triggers do banco)
export interface Activity {
  id: string;
  workspace_id: string;
  actor_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  entity_title: string | null;
  details: string | null;
  created_at: string;
}