interface ErrorStateProps {
  message: string;
  onRetry: () => void;
}

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div
      role="alert"
      className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-center dark:border-rose-500/30 dark:bg-rose-500/10"
    >
      <p className="text-sm text-rose-700 dark:text-rose-300">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-3 rounded-xl bg-rose-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-rose-600"
      >
        Tentar de novo
      </button>
    </div>
  );
}