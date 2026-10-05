import { useState } from 'react';
import { LogOut } from 'lucide-react';
import { toast } from 'sonner';
import { ThemeToggle } from '../components/ui/ThemeToggle';
import { Spinner } from '../components/ui/Spinner';
import { useAuth } from '../hooks/useAuth';
import { friendlyError } from '../lib/errors';
import { getGreeting } from '../utils/greeting';

export function HomePage() {
  const { profile, partner, signOut } = useAuth();
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

  return (
    <div className="mx-auto flex min-h-dvh max-w-3xl flex-col px-4 py-6">
      <header className="flex items-center justify-between">
        <span className="text-lg font-semibold tracking-tight">LoveNote</span>
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <button
            type="button"
            onClick={handleSignOut}
            disabled={leaving}
            aria-label="Sair"
            title="Sair"
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-stone-500 transition hover:bg-stone-200/70 hover:text-stone-900 disabled:opacity-60 dark:text-stone-400 dark:hover:bg-stone-800 dark:hover:text-stone-100"
          >
            {leaving ? <Spinner className="h-5 w-5" /> : <LogOut className="h-5 w-5" />}
          </button>
        </div>
      </header>

      <main className="flex flex-1 flex-col justify-center py-10">
        <h1 className="text-3xl font-semibold tracking-tight">
          {getGreeting()}, {profile?.display_name} ❤️
        </h1>
        <p className="mt-3 text-stone-600 dark:text-stone-400">
          {partner
            ? `Seu espaço está conectado com ${partner.display_name}.`
            : 'Seu espaço está pronto.'}
        </p>
        <p className="mt-6 rounded-2xl border border-dashed border-stone-300 p-4 text-sm text-stone-500 dark:border-stone-700 dark:text-stone-400">
          Login funcionando. Listas, tarefas, notas e planejamentos ainda não foram
          implementados: eles chegam nas próximas fases.
        </p>
      </main>
    </div>
  );
}