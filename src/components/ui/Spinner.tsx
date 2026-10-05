import { LoaderCircle } from 'lucide-react';

export function Spinner({ className = 'h-5 w-5' }: { className?: string }) {
  return <LoaderCircle className={`animate-spin ${className}`} aria-hidden="true" />;
}

export function FullScreenLoader() {
  return (
    <div
      className="flex min-h-dvh items-center justify-center text-rose-500"
      role="status"
      aria-label="Carregando"
    >
      <Spinner className="h-8 w-8" />
    </div>
  );
}