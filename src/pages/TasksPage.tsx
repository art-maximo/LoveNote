import { useMemo, useState } from 'react';
import { ListTodo } from 'lucide-react';
import { NewTaskForm } from '../components/tasks/NewTaskForm';
import { TaskEditor } from '../components/tasks/TaskEditor';
import type { TaskMember } from '../components/tasks/TaskEditor';
import { TaskRow } from '../components/tasks/TaskRow';
import { EmptyState } from '../components/ui/EmptyState';
import { ErrorState } from '../components/ui/ErrorState';
import { Segmented } from '../components/ui/Segmented';
import { Skeleton } from '../components/ui/Skeleton';
import { useAuth } from '../hooks/useAuth';
import { useCreateTask, useDeleteTask, useTasks, useUpdateTask } from '../hooks/useTasks';
import { friendlyError } from '../lib/errors';
import type { Task } from '../types';
import { canEditTask, canToggleTask, compareTasks } from '../utils/tasks';

type StatusFilter = 'pending' | 'done' | 'all';
type AssigneeFilter = 'all' | 'mine' | 'partner';

function matchesAssignee(
  task: Task,
  filter: AssigneeFilter,
  myId: string | null,
  partnerId: string | null,
): boolean {
  if (filter === 'mine') return task.assignee_id === myId;
  if (filter === 'partner') return task.assignee_id === partnerId;
  return true;
}

const EMPTY_MESSAGES: Record<StatusFilter, { title: string; description: string }> = {
  pending: {
    title: 'Nenhuma tarefa pendente',
    description: 'Tudo em dia! Adicione uma nova tarefa no campo acima.',
  },
  done: {
    title: 'Nenhuma tarefa concluída',
    description: 'As tarefas que vocês concluírem aparecem aqui.',
  },
  all: {
    title: 'Nenhuma tarefa',
    description: 'Não há tarefas com esse filtro.',
  },
};

export function TasksPage() {
  const { profile, partner } = useAuth();
  const tasksQuery = useTasks();
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();

  const [statusFilter, setStatusFilter] = useState<StatusFilter>('pending');
  const [assigneeFilter, setAssigneeFilter] = useState<AssigneeFilter>('all');
  const [editingId, setEditingId] = useState<string | null>(null);

  const myId = profile?.id ?? null;
  const partnerId = partner?.id ?? null;

  const members = useMemo<TaskMember[]>(() => {
    const list: TaskMember[] = [];
    if (profile) list.push({ id: profile.id, name: profile.display_name });
    if (partner) list.push({ id: partner.id, name: partner.display_name });
    return list;
  }, [profile, partner]);

  const nameById = useMemo(
    () => new Map(members.map((member): [string, string] => [member.id, member.name])),
    [members],
  );

  const tasks = tasksQuery.data;

  // Tarefas depois do filtro de responsável
  const scoped = useMemo(
    () =>
      (tasks ?? []).filter((task) => matchesAssignee(task, assigneeFilter, myId, partnerId)),
    [tasks, assigneeFilter, myId, partnerId],
  );

  const pendingCount = scoped.filter((task) => !task.is_done).length;
  const doneCount = scoped.length - pendingCount;
  const totalPending = (tasks ?? []).filter((task) => !task.is_done).length;

  // Depois do filtro de status, já ordenadas
  const visible = useMemo(
    () =>
      scoped
        .filter((task) => {
          if (statusFilter === 'pending') return !task.is_done;
          if (statusFilter === 'done') return task.is_done;
          return true;
        })
        .sort(compareTasks),
    [scoped, statusFilter],
  );

  const editingTask = tasks?.find((task) => task.id === editingId) ?? null;

  const statusOptions: Array<{ value: StatusFilter; label: string }> = [
    { value: 'pending', label: `Pendentes (${pendingCount})` },
    { value: 'done', label: `Concluídas (${doneCount})` },
    { value: 'all', label: 'Todas' },
  ];

  const assigneeOptions: Array<{ value: AssigneeFilter; label: string }> = [
    { value: 'all', label: 'Todas' },
    { value: 'mine', label: 'Minhas' },
    { value: 'partner', label: partner ? `De ${partner.display_name}` : 'Do parceiro' },
  ];

  function handleCreate(title: string) {
    createTask.mutate(title);
    // Garante que a tarefa nova apareça na lista, mesmo com filtros ativos.
    setStatusFilter('pending');
    setAssigneeFilter('all');
  }

  const subtitle =
    tasks === undefined
      ? 'Carregando...'
      : totalPending === 0
        ? 'Nenhuma tarefa pendente'
        : `${totalPending} ${totalPending === 1 ? 'tarefa pendente' : 'tarefas pendentes'}`;

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Tarefas</h1>
      <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">{subtitle}</p>

      <div className="mt-6">
        <NewTaskForm onCreate={handleCreate} />
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <Segmented
          ariaLabel="Filtrar por status"
          value={statusFilter}
          options={statusOptions}
          onChange={setStatusFilter}
        />
        {partner && (
          <Segmented
            ariaLabel="Filtrar por responsável"
            value={assigneeFilter}
            options={assigneeOptions}
            onChange={setAssigneeFilter}
          />
        )}
      </div>

      <div className="mt-4">
        {tasksQuery.isPending ? (
          <div className="space-y-2">
            <Skeleton className="h-14" />
            <Skeleton className="h-14" />
            <Skeleton className="h-14" />
          </div>
        ) : tasksQuery.isError ? (
          <ErrorState
            message={friendlyError(tasksQuery.error, 'Não foi possível carregar as tarefas.')}
            onRetry={() => void tasksQuery.refetch()}
          />
        ) : (tasks ?? []).length === 0 ? (
          <EmptyState
            icon={ListTodo}
            title="Nenhuma tarefa ainda"
            description="Adicione a primeira no campo acima. Por exemplo: Reservar o restaurante."
          />
        ) : visible.length === 0 ? (
          <EmptyState
            icon={ListTodo}
            title={EMPTY_MESSAGES[statusFilter].title}
            description={EMPTY_MESSAGES[statusFilter].description}
          />
        ) : (
          <ul className="space-y-2">
            {visible.map((task) => {
              const assigneeName = task.assignee_id ? (nameById.get(task.assignee_id) ?? null) : null;
              const ownerName = task.created_by ? (nameById.get(task.created_by) ?? null) : null;
              return (
                <TaskRow
                  key={task.id}
                  task={task}
                  assigneeName={assigneeName}
                  assigneeIsMe={task.assignee_id === myId}
                  locked={!canEditTask(task, myId)}
                  canToggle={canToggleTask(task, myId)}
                  ownerName={ownerName}
                  onToggle={() =>
                    updateTask.mutate({ base: task, changes: { is_done: !task.is_done } })
                  }
                  onOpen={() => setEditingId(task.id)}
                />
              );
            })}
          </ul>
        )}
      </div>

      <TaskEditor
        task={editingTask}
        members={members}
        currentUserId={myId}
        onClose={() => setEditingId(null)}
        onChange={(base, changes) => updateTask.mutate({ base, changes })}
        onDelete={(task) => deleteTask.mutate(task)}
      />
    </div>
  );
}