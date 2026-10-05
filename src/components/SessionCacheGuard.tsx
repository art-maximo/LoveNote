import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../hooks/useAuth';

// Limpa os dados guardados em cache quando a pessoa sai da conta.
export function SessionCacheGuard() {
  const { status } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (status === 'signed_out') {
      queryClient.clear();
    }
  }, [status, queryClient]);

  return null;
}