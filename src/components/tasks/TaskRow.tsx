import { AlignLeft, Calendar, Check, Lock } from 'lucide-react';
import type { Task } from '../../types';
import { formatDueDate, isOverdue } from '../../utils/dates';

interface TaskRowProps {
  task: Task;
  assigneeName: string | null;
  assigneeIsMe: boolean;
  // Sem permissão para editar (só leitura, exceto concluir se for responsável)
  locked: boolean;
  // Pode marcar como concluída
  canToggle: boolean;
  // Quem criou a tarefa (usado na dica do cadeado)
  ownerName: string | null;
  onToggle: () => void;
  onOpen: () => void;
}

export function TaskRow({
  task,
  assigneeName,
  assigneeIsMe,
  locked,
  canToggle,
  ownerName,
  onToggle,
  onOpen,
}: TaskRowProps) {
  const overdue = isOverdue(task.due_date, task.is_done);
  const lockHint = ownerName ? `Só ${ownerName} pode editar` : 'Somente leitura';

  return (
    <li className="flex items-start gap-1 rounded-xl border border-stone-200 bg-white px-1.5 py-1.5 dark:border-stone-800 dark:bg-stone-900">
      <button
        type="button"
        role="checkbox"
        aria-checked={task.is_done}
        aria-label={task.is_done ? 'Marcar como pendente' : 'Marcar como concluída'}
        disabled={!canToggle}
        onClick={onToggle}
        className="flex h-9 w-9 shrink-0 items-center justify-center disabled:cursor-not-allowed disabled:opacity-50"
      >
        <span
          className={`flex h-5 w-5 items-center justify-center rounded-full border-2 transition ${
            task.is_done
              ? 'border-rose-500 bg-rose-500 text-white'
              : 'border-stone-300 dark:border-stone-600'
          }`}
        >
          {task.is_done && <Check className="h-3 w-3" strokeWidth={3} />}
        </span>
      </button>

      <button
        type="button"
        onClick={onOpen}
        className="min-w-0 flex-1 rounded-lg px-1 py-1.5 text-left transition hover:bg-stone-50 dark:hover:bg-stone-800/50"
      >
        <span
          className={`block break-words text-sm leading-6 ${
            task.is_done ? 'text-stone-400 line-through dark:text-stone-500' : ''
          }`}
        >
          {task.title}
        </span>

        <span className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs empty:hidden">
          {task.due_date && (
            <span
              className={`inline-flex items-center gap-1 ${
                overdue
                  ? 'font-medium text-red-600 dark:text-red-400'
                  : 'text-stone-500 dark:text-stone-400'
              }`}
            >
              <Calendar className="h-3.5 w-3.5" />
              {formatDueDate(task.due_date)}
              {overdue && ' · atrasada'}
            </span>
          )}
          {task.priority === 'high' && (
            <span className="rounded-md bg-rose-100 px-1.5 py-0.5 font-medium text-rose-700 dark:bg-rose-500/15 dark:text-rose-300">
              Alta
            </span>
          )}
          {task.priority === 'low' && (
            <span className="rounded-md bg-stone-100 px-1.5 py-0.5 font-medium text-stone-500 dark:bg-stone-800 dark:text-stone-400">
              Baixa
            </span>
          )}
          {task.description && (
            <AlignLeft className="h-3.5 w-3.5 text-stone-400" aria-label="Tem descrição" />
          )}
          {locked && (
            <span title={lockHint} className="inline-flex">
              <Lock className="h-3.5 w-3.5 text-stone-400" aria-label={lockHint} />
            </span>
          )}
        </span>
      </button>

      {assigneeName && (
        <span
          title={`Responsável: ${assigneeName}`}
          aria-label={`Responsável: ${assigneeName}`}
          className={`mr-1 mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
            assigneeIsMe
              ? 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300'
              : 'bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-300'
          }`}
        >
          {assigneeName.charAt(0).toUpperCase()}
        </span>
      )}
    </li>
  );
}