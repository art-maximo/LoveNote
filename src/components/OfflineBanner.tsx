import { useConnection } from '../hooks/useConnection';

export function OfflineBanner() {
  const { status } = useConnection();
  if (status !== 'offline') return null;

  return (
    <div
      role="alert"
      className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300"
    >
      Sem conexão. As edições ficam bloqueadas até a internet voltar. O que já foi salvo
      continua guardado.
    </div>
  );
}