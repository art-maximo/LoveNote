import { useEffect, useRef } from 'react';
import type { MouseEvent } from 'react';
import { Check, Lock, Trash2, X } from 'lucide-react';
import { LiveField } from '../ui/LiveField';
import type { Task, TaskChanges } from '../../types';
import { formatDateTime } from '../../utils/dates';
import {
  PRIORITY_LABELS,
  PRIORITY_OPTIONS,
  canEditTask,
  canToggleTask,
  isTaskPriority,
} from '../../utils/tasks';

export interface TaskMember {
  id: string;
  name: string;
}

interface TaskEditorProps {
  task: Task | null;
  members: TaskMember[];
  currentUserId: string | null;
  onClose: () => void;
  onChange: (base: Task, changes: TaskChanges) => void;
  onDelete: (task: Task) => void;
}

const selectClass =
  'w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-rose-400 focus:ring-4 focus:ring-rose-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-stone-700 dark:bg-stone-950 dark:focus:ring-rose-400/20';

// Tira o foco do campo ativo, o que salva o que estava sendo digitado.
function blurActiveElement(): void {
  if (document.activeElement instanceof HTMLElement) {
    document.activeElement.blur();
  }
}

interface EditorBodyProps {
  task: Task;
  members: TaskMember[];
  currentUserId: string | null;
  onClose: () => void;
  onChange: (base: Task, changes: TaskChanges) => void;
  onDelete: (task: Task) => void;
}

function EditorBody({ task, members, currentUserId, onClose, onChange, onDelete }: EditorBodyProps) {
  // A tarefa como estava quando a pessoa começou a editar o campo.
  const baseRef = useRef<Task>(task);
  const markBase = () => {
    baseRef.current = task;
  };

  const canEdit = canEditTask(task, currentUserId);
  const canToggle = canToggleTask(task, currentUserId);
  const isOwner = task.created_by === null || task.created_by === currentUserId;
  const creator = members.find((member) => member.id === task.created_by);
  const other = members.find((member) => member.id !== currentUserId);

  return (
    <div className="p-5">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-medium text-stone-500 dark:text-stone-400">Tarefa</h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar"
          className="flex h-9 w-9 items-center justify-center rounded-xl text-stone-400 transition hover:bg-stone-100 hover:text-stone-700 dark:hover:bg-stone-800"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {!canEdit && (
        <p className="mb-3 flex items-start gap-2 rounded-xl bg-stone-100 px-3 py-2.5 text-sm text-stone-600 dark:bg-stone-800 dark:text-stone-300">
          <Lock className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            Só {creator?.name ?? 'quem criou'} pode editar esta tarefa.
            {canToggle && ' Como você é a pessoa responsável, pode marcá-la como concluída.'}
          </span>
        </p>
      )}

      <LiveField
        ariaLabel="Título da tarefa"
        value={task.title}
        maxLength={200}
        disabled={!canEdit}
        className="text-lg font-semibold"
        onFocusStart={markBase}
        onCommit={(title) => onChange(baseRef.current, { title })}
      />

      <button
        type="button"
        disabled={!canToggle}
        onClick={() => onChange(task, { is_done: !task.is_done })}
        className={`mt-3 inline-flex items-center gap-2 rounded-xl border px-3 py-1.5 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60 ${
          task.is_done
            ? 'border-rose-500 bg-rose-500 text-white hover:bg-rose-600'
            : 'border-stone-300 text-stone-700 hover:bg-stone-100 dark:border-stone-700 dark:text-stone-200 dark:hover:bg-stone-800'
        }`}
      >
        <Check className="h-4 w-4" />
        {task.is_done ? 'Concluída' : 'Marcar como concluída'}
      </button>

      <div className="mt-5">
        <span className="mb-1 block text-xs font-medium text-stone-500 dark:text-stone-400">
          Descrição
        </span>
        <LiveField
          multiline
          allowEmpty
          ariaLabel="Descrição da tarefa"
          placeholder={canEdit ? 'Detalhes, links, o que precisa ser feito...' : 'Sem descrição'}
          value={task.description ?? ''}
          maxLength={5000}
          disabled={!canEdit}
          className="border-stone-200 text-sm dark:border-stone-800"
          onFocusStart={markBase}
          onCommit={(text) =>
            onChange(baseRef.current, { description: text === '' ? null : text })
          }
        />
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div>
          <label
            htmlFor="task-priority"
            className="mb-1 block text-xs font-medium text-stone-500 dark:text-stone-400"
          >
            Prioridade
          </label>
          <select
            id="task-priority"
            value={task.priority}
            disabled={!canEdit}
            onChange={(event) => {
              const value = event.target.value;
              if (isTaskPriority(value)) onChange(task, { priority: value });
            }}
            className={selectClass}
          >
            {PRIORITY_OPTIONS.map((priority) => (
              <option key={priority} value={priority}>
                {PRIORITY_LABELS[priority]}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="task-assignee"
            className="mb-1 block text-xs font-medium text-stone-500 dark:text-stone-400"
          >
            Responsável
          </label>
          <select
            id="task-assignee"
            value={task.assignee_id ?? ''}
            disabled={!canEdit}
            onChange={(event) =>
              onChange(task, { assignee_id: event.target.value === '' ? null : event.target.value })
            }
            className={selectClass}
          >
            <option value="">Sem responsável</option>
            {members.map((member) => (
              <option key={member.id} value={member.id}>
                {member.id === currentUserId ? `${member.name} (você)` : member.name}
              </option>
            ))}
          </select>
        </div>

        <div className="sm:col-span-2">
          <label
            htmlFor="task-due"
            className="mb-1 block text-xs font-medium text-stone-500 dark:text-stone-400"
          >
            Prazo
          </label>
          <div className="flex items-center gap-2">
            {/* Campo não controlado: não atrapalha a digitação da data. A chave faz
                o campo refletir mudanças vindas do outro aparelho. */}
            <input
              key={`due-${task.due_date ?? 'none'}`}
              id="task-due"
              type="date"
              min="2000-01-01"
              max="2100-12-31"
              disabled={!canEdit}
              defaultValue={task.due_date ?? ''}
              onChange={(event) => {
                const value = event.target.value;
                if (value === '' || value === (task.due_date ?? '')) return;
                const year = Number(value.slice(0, 4));
                if (year < 2000 || year > 2100) return;
                onChange(task, { due_date: value });
              }}
              className={`${selectClass} flex-1`}
            />
            {task.due_date && canEdit && (
              <button
                type="button"
                onClick={() => onChange(task, { due_date: null })}
                className="shrink-0 rounded-xl border border-stone-300 px-3 py-2 text-sm font-medium text-stone-600 transition hover:bg-stone-100 dark:border-stone-700 dark:text-stone-300 dark:hover:bg-stone-800"
              >
                Limpar
              </button>
            )}
          </div>
        </div>
      </div>

      {isOwner && other && (
        <button
          type="button"
          role="switch"
          aria-checked={task.allow_partner_edit}
          onClick={() => onChange(task, { allow_partner_edit: !task.allow_partner_edit })}
          className="mt-5 flex w-full items-center justify-between gap-3 rounded-xl border border-stone-200 px-3.5 py-3 text-left transition hover:bg-stone-50 dark:border-stone-800 dark:hover:bg-stone-800/50"
        >
          <span>
            <span className="block text-sm font-medium">Permitir que {other.name} edite</span>
            <span className="mt-0.5 block text-xs text-stone-500 dark:text-stone-400">
              Desligado, só você edita esta tarefa. {other.name} só poderá marcá-la como
              concluída se for a pessoa responsável.
            </span>
          </span>
          <span
            aria-hidden="true"
            className={`relative inline-flex h-6 w-11 shrink-0 rounded-full transition ${
              task.allow_partner_edit ? 'bg-rose-500' : 'bg-stone-300 dark:bg-stone-700'
            }`}
          >
            <span
              className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition ${
                task.allow_partner_edit ? 'translate-x-5' : ''
              }`}
            />
          </span>
        </button>
      )}

      {!isOwner && task.allow_partner_edit && (
        <p className="mt-5 text-xs text-stone-500 dark:text-stone-400">
          {creator?.name ?? 'Quem criou'} permitiu que você edite esta tarefa.
        </p>
      )}

      <div className="mt-6 flex items-end justify-between gap-3 border-t border-stone-200 pt-4 dark:border-stone-800">
        <p className="text-xs text-stone-500 dark:text-stone-400">
          Criada{creator ? ` por ${creator.name}` : ''} em {formatDateTime(task.created_at)}
          {task.completed_at && (
            <>
              <br />
              Concluída em {formatDateTime(task.completed_at)}
            </>
          )}
        </p>
        {canEdit && (
          <button
            type="button"
            onClick={() => {
              onDelete(task);
              onClose();
            }}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium text-rose-600 transition hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-500/10"
          >
            <Trash2 className="h-4 w-4" />
            Excluir
          </button>
        )}
      </div>
    </div>
  );
}

export function TaskEditor({
  task,
  members,
  currentUserId,
  onClose,
  onChange,
  onDelete,
}: TaskEditorProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const open = task !== null;

  // Usa o <dialog> nativo: foco, tecla Esc e fundo escurecido já vêm prontos.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  function handleClose() {
    blurActiveElement();
    onClose();
  }

  function handleBackdropClick(event: MouseEvent<HTMLDialogElement>) {
    if (event.target === event.currentTarget) handleClose();
  }

  return (
    <dialog
      ref={dialogRef}
      onCancel={blurActiveElement}
      onClose={() => {
        if (open) onClose();
      }}
      onClick={handleBackdropClick}
      className="m-auto max-h-[calc(100dvh-2rem)] w-[calc(100vw-1.5rem)] max-w-lg overflow-y-auto rounded-2xl border border-stone-200 bg-white p-0 text-stone-900 shadow-xl backdrop:bg-stone-950/50 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100"
    >
      {task && (
        <EditorBody
          key={task.id}
          task={task}
          members={members}
          currentUserId={currentUserId}
          onClose={handleClose}
          onChange={onChange}
          onDelete={onDelete}
        />
      )}
    </dialog>
  );
}