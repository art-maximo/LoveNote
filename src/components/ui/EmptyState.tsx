import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  children?: ReactNode;
}

export function EmptyState({ icon: Icon, title, description, children }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-stone-300 px-6 py-12 text-center dark:border-stone-700">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-100 text-rose-500 dark:bg-rose-500/15">
        <Icon className="h-6 w-6" />
      </div>
      <h2 className="font-medium">{title}</h2>
      <p className="mt-1 max-w-sm text-sm text-stone-500 dark:text-stone-400">{description}</p>
      {children && <div className="mt-5">{children}</div>}
    </div>
  );
}