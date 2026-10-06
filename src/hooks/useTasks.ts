import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { applyServerRow, removeFromCache } from '../lib/cacheSync';
import { notifyConflict } from '../lib/conflicts';
import { friendlyError } from '../lib/errors';
import { queryKeys } from '../lib/queryKeys';
import { runSerial } from '../lib/rowQueue';
import { createTask, deleteTask, fetchTasks, restoreTask } from '../services/tasksService';
import { updateVersioned } from '../services/versionedUpdate';
import type { UpdateOutcome } from '../services/versionedUpdate';
import type { Task, TaskChanges } from '../types';
import { patchById, upsertById } from '../utils/cache';
import { assertOnline } from '../utils/network';
import { TASK_FIELD_LABELS, describeTaskValue } from '../utils/tasks';
import { useAuth } from './useAuth';
import { useWorkspaceId } from './useWorkspaceId';

export function useTasks() {
  const workspaceId = useWorkspaceId();
  return useQuery({
    queryKey: queryKeys.tasks(workspaceId),
    queryFn: () => fetchTasks(workspaceId),
  });
}

export function useCreateTask() {
  const queryClient = useQueryClient();
  const workspaceId = useWorkspaceId();
  const key = queryKeys.tasks(workspaceId);

  return useMutation({
    mutationFn: async (title: string) => {
      assertOnline();
      return createTask(workspaceId, title);
    },
    onSuccess: (row) => {
      queryClient.setQueryData<Task[]>(key, (old) => upsertById(old, row));
    },
    onError: (error) => {
      toast.error(friendlyError(error, 'Não foi possível criar a tarefa.'));
    },
  });
}

interface UpdateVariables {
  // A tarefa como estava quando a pessoa começou a editar.
  base: Task;
  changes: TaskChanges;
}

export function useUpdateTask() {
  const queryClient = useQueryClient();
  const workspaceId = useWorkspaceId();
  const { profile, partner } = useAuth();
  const key = queryKeys.tasks(workspaceId);
  const partnerName = partner?.display_name ?? 'A outra pessoa';

  const nameById = new Map<string, string>();
  if (profile) nameById.set(profile.id, profile.display_name);
  if (partner) nameById.set(partner.id, partner.display_name);

  function save(
    base: Task,
    changes: TaskChanges,
    force: boolean,
  ): Promise<UpdateOutcome<Task>> {
    return runSerial(base.id, () => updateVersioned<Task>('tasks', base, changes, { force }));
  }

  function handleOutcome(outcome: UpdateOutcome<Task>, base: Task, changes: TaskChanges): void {
    if (outcome.status === 'ok') {
      applyServerRow(queryClient, key, outcome.row);
      return;
    }
    if (outcome.status === 'gone') {
      removeFromCache(queryClient, key, base.id);
      toast.info(`${partnerName} excluiu esta tarefa.`);
      return;
    }
    // Conflito: a versão da outra pessoa fica na tela e a pessoa escolhe.
    const { server, field } = outcome;
    applyServerRow(queryClient, key, server);
    notifyConflict({
      partnerName,
      field,
      fieldLabel: TASK_FIELD_LABELS[field],
      mine: describeTaskValue(field, changes[field as keyof TaskChanges], nameById),
      theirs: describeTaskValue(field, server[field as keyof Task], nameById),
      onUseMine: () => {
        void forceMine(server, changes);
      },
    });
  }

  async function forceMine(server: Task, changes: TaskChanges): Promise<void> {
    try {
      assertOnline();
      queryClient.setQueryData<Task[]>(key, (old) => patchById(old, server.id, changes));
      const outcome = await save(server, changes, true);
      handleOutcome(outcome, server, changes);
    } catch (error) {
      toast.error(friendlyError(error, 'Não foi possível salvar a sua versão.'));
      void queryClient.invalidateQueries({ queryKey: key });
    }
  }

  return useMutation({
    mutationFn: ({ base, changes }: UpdateVariables) => save(base, changes, false),
    // Atualização otimista: a tela muda na hora.
    onMutate: async ({ base, changes }) => {
      assertOnline();
      await queryClient.cancelQueries({ queryKey: key });
      queryClient.setQueryData<Task[]>(key, (old) => patchById(old, base.id, changes));
    },
    onSuccess: (outcome, { base, changes }) => {
      handleOutcome(outcome, base, changes);
    },
    onError: (error) => {
      toast.error(friendlyError(error, 'Não foi possível salvar a alteração.'));
      void queryClient.invalidateQueries({ queryKey: key });
    },
  });
}

export function useDeleteTask() {
  const queryClient = useQueryClient();
  const workspaceId = useWorkspaceId();
  const key = queryKeys.tasks(workspaceId);

  return useMutation({
    mutationFn: async (task: Task) => {
      assertOnline();
      await deleteTask(task.id);
    },
    onMutate: async (task) => {
      await queryClient.cancelQueries({ queryKey: key });
      removeFromCache(queryClient, key, task.id);
    },
    onError: (error, task) => {
      // Devolve só esta tarefa (sem mexer no resto da lista).
      queryClient.setQueryData<Task[]>(key, (old) => upsertById(old, task));
      toast.error(friendlyError(error, 'Não foi possível excluir a tarefa.'));
    },
    onSuccess: (_data, task) => {
      toast('Tarefa excluída.', {
        action: {
          label: 'Desfazer',
          onClick: () => {
            restoreTask(task.id)
              .then((row) => {
                queryClient.setQueryData<Task[]>(key, (old) => upsertById(old, row));
              })
              .catch((error: unknown) => {
                toast.error(friendlyError(error, 'Não foi possível desfazer.'));
              });
          },
        },
      });
    },
  });
}