import { NavLink, Outlet } from 'react-router-dom';
import { Heart, LogOut } from 'lucide-react';
import { ThemeToggle } from '../components/ui/ThemeToggle';
import { Spinner } from '../components/ui/Spinner';
import { useAuth } from '../hooks/useAuth';
import { useSignOut } from '../hooks/useSignOut';
import { NAV_ITEMS } from './navItems';

function Brand() {
  return (
    <div className="flex items-center gap-2 text-lg font-semibold tracking-tight">
      <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-100 text-rose-500 dark:bg-rose-500/15">
        <Heart className="h-4 w-4" fill="currentColor" />
      </span>
      LoveNote
    </div>
  );
}

export function AppLayout() {
  const { profile } = useAuth();
  const { leaving, handleSignOut } = useSignOut();

  const signOutButton = (
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
  );

  return (
    <div className="min-h-dvh md:pl-60">
      {/* Sidebar (computador / tablet) */}
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-60 flex-col border-r border-stone-200 bg-white/70 p-4 backdrop-blur md:flex dark:border-stone-800 dark:bg-stone-900/60">
        <Brand />
        <nav className="mt-8 flex flex-col gap-1" aria-label="Navegação principal">
          {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition ${
                  isActive
                    ? 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300'
                    : 'text-stone-600 hover:bg-stone-100 dark:text-stone-400 dark:hover:bg-stone-800'
                }`
              }
            >
              <Icon className="h-4 w-4" />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="mt-auto flex items-center justify-between gap-2 border-t border-stone-200 pt-4 dark:border-stone-800">
          <span className="truncate text-sm font-medium">{profile?.display_name}</span>
          <div className="flex shrink-0 items-center">
            <ThemeToggle />
            {signOutButton}
          </div>
        </div>
      </aside>

      {/* Barra superior (celular) */}
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-stone-200 bg-stone-50/85 px-4 pb-2 pt-[calc(env(safe-area-inset-top)+0.5rem)] backdrop-blur md:hidden dark:border-stone-800 dark:bg-stone-950/85">
        <Brand />
        <div className="flex items-center">
          <ThemeToggle />
          {signOutButton}
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl px-4 py-6 pb-28 md:px-8 md:py-10 md:pb-10">
        <Outlet />
      </main>

      {/* Navegação inferior (celular) */}
      <nav
        aria-label="Navegação principal"
        className="fixed inset-x-0 bottom-0 z-20 flex border-t border-stone-200 bg-white/90 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden dark:border-stone-800 dark:bg-stone-900/90"
      >
        {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex flex-1 flex-col items-center gap-0.5 py-2.5 text-xs font-medium transition ${
                isActive ? 'text-rose-600 dark:text-rose-400' : 'text-stone-500 dark:text-stone-400'
              }`
            }
          >
            <Icon className="h-5 w-5" />
            {label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
