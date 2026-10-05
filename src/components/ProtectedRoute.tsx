import { useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '../hooks/useAuth';
import { friendlyError } from '../lib/errors';
import { FullScreenLoader, Spinner } from './ui/Spinner';

function AccountProblem() {
  const { status, errorMessage, reloadAccount, signOut } = useAuth();
  const [leaving, setLeaving] = useState(false);

  async function handleSignOut() {
    setLeaving(true);
    try {
      await signOut();
    } catch (error) {
      toast.error(friendlyError(error, 'Não foi possível sair.'));
      setLeaving(false);
    }
  }

  const message =
    status === 'no_workspace'
      ? 'Sua conta ainda não está vinculada ao espaço do casal. Confira se o script 02_seed.sql foi executado.'
      : (errorMessage ?? 'Não foi possível carregar sua conta.');

  return (
    <div className="flex min-h-dvh items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-2xl border border-stone-200 bg-white p-6 text-center shadow-sm dark:border-stone-800 dark:bg-stone-900">
        <h1 className="text-lg font-semibold">Algo não saiu como esperado</h1>
        <p className="mt-2 text-sm text-stone-600 dark:text-stone-400">{message}</p>
        <div className="mt-5 flex flex-col gap-2">
          <button
            type="button"
            onClick={reloadAccount}
            className="rounded-xl bg-rose-500 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-rose-600 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-rose-200"
          >
            Tentar de novo
          </button>
          <button
            type="button"
            onClick={handleSignOut}
            disabled={leaving}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-stone-300 px-4 py-2.5 text-sm font-medium text-stone-700 transition hover:bg-stone-100 disabled:opacity-60 dark:border-stone-700 dark:text-stone-200 dark:hover:bg-stone-800"
          >
            {leaving && <Spinner className="h-4 w-4" />}
            Sair
          </button>
        </div>
      </div>
    </div>
  );
}

export function ProtectedRoute() {
  const { status } = useAuth();

  if (status === 'loading' || status === 'loading_account') {
    return <FullScreenLoader />;
  }
  if (status === 'signed_out') {
    return <Navigate to="/login" replace />;
  }
  if (status === 'no_workspace' || status === 'error') {
    return <AccountProblem />;
  }
  return <Outlet />;
}
