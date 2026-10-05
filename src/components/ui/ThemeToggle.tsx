import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? 'Usar tema claro' : 'Usar tema escuro'}
      title={isDark ? 'Tema claro' : 'Tema escuro'}
      className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-stone-500 transition hover:bg-stone-200/70 hover:text-stone-900 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-rose-200 dark:text-stone-400 dark:hover:bg-stone-800 dark:hover:text-stone-100 dark:focus-visible:ring-rose-400/30"
    >
      {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
    </button>
  );
}