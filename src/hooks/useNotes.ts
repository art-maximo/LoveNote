import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { removeFromCache } from '../lib/cacheSync';
import { friendlyError } from '../lib/errors';
import { queryKeys } from '../lib/queryKeys';
import { createNote, deleteNote, fetchNotes } from '../services/notesService';
import type { Note } from '../types';
import { upsertById } from '../utils/cache';
import { assertOnline } from '../utils/network';
import { useWorkspaceId } from './useWorkspaceId';

export function useNotes() {
  const workspaceId = useWorkspaceId();
  return useQuery({
    queryKey: queryKeys.notes(workspaceId),
    queryFn: () => fetchNotes(workspaceId),
  });
}

export function useCreateNote() {
  const queryClient = useQueryClient();
  const workspaceId = useWorkspaceId();
  const key = queryKeys.notes(workspaceId);

  return useMutation({
    mutationFn: async () => {
      assertOnline();
      return createNote({ workspaceId });
    },
    onSuccess: (row) => {
      queryClient.setQueryData<Note[]>(key, (old) => upsertById(old, row));
    },
    onError: (error) => {
      toast.error(friendlyError(error, 'Não foi possível criar a anotação.'));
    },
  });
}

export function useDeleteNote() {
  const queryClient = useQueryClient();
  const workspaceId = useWorkspaceId();
  const key = queryKeys.notes(workspaceId);

  return useMutation({
    mutationFn: async (id: string) => {
      assertOnline();
      await deleteNote(id);
    },
    onSuccess: (_data, id) => {
      removeFromCache(queryClient, key, id);
      toast.success('Anotação excluída.');
    },
    onError: (error) => {
      toast.error(friendlyError(error, 'Não foi possível excluir a anotação.'));
    },
  });
}