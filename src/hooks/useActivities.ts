import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../lib/queryKeys';
import { fetchActivities } from '../services/activitiesService';
import { useWorkspaceId } from './useWorkspaceId';

export function useActivities() {
  const workspaceId = useWorkspaceId();
  return useQuery({
    queryKey: queryKeys.activities(workspaceId),
    queryFn: () => fetchActivities(workspaceId),
  });
}