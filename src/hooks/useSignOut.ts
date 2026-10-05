import { useCallback, useState } from 'react';
import { toast } from 'sonner';
import { friendlyError } from '../lib/errors';
import { useAuth } from './useAuth';

export function useSignOut() {
  const { signOut } = useAuth();
  const [leaving, setLeaving] = useState(false);

  const handleSignOut = useCallback(async () => {
    setLeaving(true);
    try {
      await signOut();
    } catch (error) {
      toast.error(friendlyError(error, 'Não foi possível sair.'));
      setLeaving(false);
    }
  }, [signOut]);

  return { leaving, handleSignOut };
}