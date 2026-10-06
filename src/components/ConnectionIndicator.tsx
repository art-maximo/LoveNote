import type { ConnectionStatus } from '../contexts/realtime-context';
import { useAuth } from '../hooks/useAuth';
import { useConnection } from '../hooks/useConnection';

const STATUS_VIEW: Record<ConnectionStatus, { label: string; dot: string }> = {
  connecting: { label: 'Conectando...', dot: 'bg-amber-400' },
  connected: { label: 'Conectado', dot: 'bg-emerald-500' },
  synced: { label: 'Sincronizado', dot: 'bg-emerald-500' },
  reconnecting: { label: 'Reconectando...', dot: 'bg-amber-400' },
  offline: { label: 'Sem conexão', dot: 'bg-red-500' },
};

export function ConnectionIndicator({ compact = false }: { compact?: boolean }) {
  const { status, partnerOnline } = useConnection();
  const { partner } = useAuth();
  const view = STATUS_VIEW[status];
  const partnerText = partner && partnerOnline ? `${partner.display_name} está online` : null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="text-xs text-stone-500 dark:text-stone-400"
    >
      <div className="flex items-center gap-1.5">
        <span className={`h-2 w-2 rounded-full ${view.dot}`} aria-hidden="true" />
        <span>{view.label}</span>
        {compact && partnerText && <span>· {partnerText}</span>}
      </div>
      {!compact && partnerText && (
        <div className="mt-1 flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-emerald-500" aria-hidden="true" />
          <span>{partnerText}</span>
        </div>
      )}
    </div>
  );
}