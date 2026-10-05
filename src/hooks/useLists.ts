import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../lib/queryKeys';
import { fetchLists } from '../services/listsService';
import { useWorkspaceId } from './useWorkspaceId';

export function useLists() {
  const workspaceId = useWorkspaceId();
  return useQuery({
    queryKey: queryKeys.lists(workspaceId),
    queryFn: () => fetchLists(workspaceId),
  });
}