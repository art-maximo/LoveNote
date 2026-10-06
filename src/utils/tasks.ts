import type { Task, TaskPriority } from '../types';
import { formatDueDate } from './dates';

export const PRIORITY_LABELS: Record<TaskPriority, string> = {
  low: 'Baixa',
  medium: 'Média',
  high: 'Alta',
};

export const PRIORITY_OPTIONS: TaskPriority[] = ['high', 'medium', 'low'];

const PRIORITY_RANK: Record<TaskPriority, number> = { high: 0, medium: 1, low: 2 };

export function isTaskPriority(value: string): value is TaskPriority {
  return value === 'low' || value === 'medium' || value === 'high';
}

// Nome do campo usado na mensagem de conflito.
export const TASK_FIELD_LABELS: Record<string, string> = {
  title: 'o título da tarefa',
  description: 'a descrição',
  is_done: 'o status da tarefa',
  priority: 'a prioridade',
  due_date: 'o prazo',
  assignee_id: 'o responsável',
  allow_partner_edit: 'a permissão de edição',
};

// Quem pode editar tudo: o criador, ou qualquer pessoa se o criador permitiu.
// (O banco aplica a mesma regra; aqui ela só serve para ajustar a tela.)
export function canEditTask(task: Task, userId: string | null): boolean {
  return task.created_by === null || task.created_by === userId || task.allow_partner_edit;
}

// Marcar como concluída: quem pode editar ou a pessoa responsável.
export function canToggleTask(task: Task, userId: string | null): boolean {
  return canEditTask(task, userId) || (userId !== null && task.assignee_id === userId);
}

// Ordem: pendentes antes de concluídas; pendentes por prazo (sem prazo no fim),
// depois prioridade, depois antiguidade; concluídas da mais recente para a mais antiga.
export function compareTasks(a: Task, b: Task): number {
  if (a.is_done !== b.is_done) return a.is_done ? 1 : -1;

  if (a.is_done) {
    return (b.completed_at ?? '').localeCompare(a.completed_at ?? '');
  }

  if (a.due_date !== b.due_date) {
    if (a.due_date === null) return 1;
    if (b.due_date === null) return -1;
    return a.due_date.localeCompare(b.due_date);
  }

  const byPriority = PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
  if (byPriority !== 0) return byPriority;

  return a.created_at.localeCompare(b.created_at);
}

// Transforma o valor de um campo em texto legível (para o aviso de conflito).
export function describeTaskValue(
  field: string,
  value: unknown,
  nameById: ReadonlyMap<string, string>,
): unknown {
  if (field === 'priority' && typeof value === 'string' && isTaskPriority(value)) {
    return PRIORITY_LABELS[value];
  }
  if (field === 'due_date') {
    return typeof value === 'string' ? formatDueDate(value) : null;
  }
  if (field === 'assignee_id') {
    return typeof value === 'string' ? (nameById.get(value) ?? 'alguém') : 'Sem responsável';
  }
  if (field === 'allow_partner_edit') {
    return value === true ? 'permitido' : 'não permitido';
  }
  return value;
}