import { CalendarDays, FileText, ListChecks, ListTodo } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { Profile } from '../types';
import type { Activity } from '../types/activity';

// Quem fez a ação ("Você", o nome do parceiro ou "Alguém").
export function actorLabel(
  actorId: string | null,
  me: Profile | null,
  partner: Profile | null,
): string {
  if (actorId && me && actorId === me.id) return 'Você';
  if (actorId && partner && actorId === partner.id) return partner.display_name;
  return 'Alguém';
}

export function activityIcon(entityType: string): LucideIcon {
  switch (entityType) {
    case 'task':
      return ListTodo;
    case 'note':
      return FileText;
    case 'plan':
      return CalendarDays;
    default:
      return ListChecks;
  }
}

function quoted(text: string | null): string {
  const value = text !== null && text.trim() !== '' ? text.trim() : 'Sem título';
  return `“${value}”`;
}

// Frase da ação, sem o nome de quem fez (ex.: 'criou a lista “Compras”').
export function describeActivity(activity: Activity): string {
  const title = quoted(activity.entity_title);
  const details = quoted(activity.details);

  switch (activity.action) {
    case 'list_created':
      return `criou a lista ${title}`;
    case 'list_deleted':
      return `excluiu a lista ${title}`;
    case 'list_renamed':
      return `renomeou a lista ${details} para ${title}`;
    case 'item_added':
      return `adicionou ${title} à lista ${details}`;
    case 'item_checked':
      return `marcou ${title} como concluído na lista ${details}`;
    case 'item_unchecked':
      return `desmarcou ${title} na lista ${details}`;
    case 'task_created':
      return `criou a tarefa ${title}`;
    case 'task_deleted':
      return `excluiu a tarefa ${title}`;
    case 'task_completed':
      return `concluiu a tarefa ${title}`;
    case 'task_reopened':
      return `reabriu a tarefa ${title}`;
    case 'note_created':
      return `criou a anotação ${title}`;
    case 'note_edited':
      return `editou a anotação ${title}`;
    case 'note_deleted':
      return `excluiu a anotação ${title}`;
    case 'plan_created':
      return `criou o planejamento ${title}`;
    case 'plan_edited':
      return `editou o planejamento ${title}`;
    case 'plan_deleted':
      return `excluiu o planejamento ${title}`;
    default:
      return 'fez uma alteração';
  }
}

// Para onde a atividade leva (null = não leva a lugar nenhum, ex.: coisa excluída).
export function activityLink(activity: Activity): string | null {
  const id = activity.entity_id;
  if (!id) return null;

  switch (activity.action) {
    case 'list_created':
    case 'list_renamed':
      return `/listas/${id}`;
    case 'item_added':
    case 'item_checked':
    case 'item_unchecked':
      return '/listas';
    case 'task_created':
    case 'task_completed':
    case 'task_reopened':
      return '/tarefas';
    case 'note_created':
    case 'note_edited':
      return `/notas/${id}`;
    case 'plan_created':
    case 'plan_edited':
      return `/planos/${id}`;
    default:
      return null;
  }
}