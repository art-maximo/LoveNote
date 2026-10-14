import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';
import { ErrorState } from '../ui/ErrorState';
import { Skeleton } from '../ui/Skeleton';
import { friendlyError } from '../../lib/errors';

interface DashboardCardProps {
  title: string;
  icon: LucideIcon;
  // Para onde leva o "Ver tudo" (sem isso, o link não aparece)
  to?: string;
  children: ReactNode;
}

export function DashboardCard({ title, icon: Icon, to, children }: DashboardCardProps) {
  return (
    <section className="rounded-2xl border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-sm font-semibold">
          <Icon className="h-4 w-4 text-rose-500" />
          {title}
        </h2>
        {to && (
          <Link
            to={to}
            className="text-xs font-medium text-rose-600 hover:underline dark:text-rose-400"
          >
            Ver tudo
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}

interface DashboardRowProps {
  // null = linha sem link
  to: string | null;
  children: ReactNode;
}

const rowClass = 'flex items-center gap-3 rounded-xl px-2 py-2';

export function DashboardRow({ to, children }: DashboardRowProps) {
  if (to === null) {
    return (
      <li>
        <div className={rowClass}>{children}</div>
      </li>
    );
  }
  return (
    <li>
      <Link
        to={to}
        className={`${rowClass} transition hover:bg-stone-50 dark:hover:bg-stone-800/50`}
      >
        {children}
      </Link>
    </li>
  );
}

interface CardBodyProps {
  isPending: boolean;
  isError: boolean;
  error: unknown;
  onRetry: () => void;
  empty: boolean;
  emptyText: string;
  children: ReactNode;
}

// Cuida dos estados de carregando, erro e vazio de um cartão.
export function CardBody({
  isPending,
  isError,
  error,
  onRetry,
  empty,
  emptyText,
  children,
}: CardBodyProps) {
  if (isPending) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-9" />
        <Skeleton className="h-9" />
        <Skeleton className="h-9" />
      </div>
    );
  }
  if (isError) {
    return <ErrorState message={friendlyError(error, 'Não foi possível carregar.')} onRetry={onRetry} />;
  }
  if (empty) {
    return <p className="px-2 py-3 text-sm text-stone-500 dark:text-stone-400">{emptyText}</p>;
  }
  return <>{children}</>;
}