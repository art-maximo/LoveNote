export function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={`animate-pulse rounded-xl bg-stone-200 dark:bg-stone-800 ${className}`}
    />
  );
}
