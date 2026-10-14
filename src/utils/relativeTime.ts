import { formatDateTime } from './dates';

const formatter = new Intl.RelativeTimeFormat('pt-BR', { numeric: 'auto' });

// "agora", "há 5 minutos", "há 2 horas", "ontem", "há 3 dias"...
// Depois de uma semana, mostra a data e a hora.
export function formatRelative(timestamp: string): string {
  const diffMs = new Date(timestamp).getTime() - Date.now();
  // Pequenas diferenças de relógio entre aparelhos viram "agora", nunca "daqui a..."
  const seconds = Math.min(0, Math.round(diffMs / 1000));

  if (Math.abs(seconds) < 45) return 'agora';

  const minutes = Math.round(seconds / 60);
  if (Math.abs(minutes) < 60) return formatter.format(minutes, 'minute');

  const hours = Math.round(minutes / 60);
  if (Math.abs(hours) < 24) return formatter.format(hours, 'hour');

  const days = Math.round(hours / 24);
  if (Math.abs(days) < 7) return formatter.format(days, 'day');

  return formatDateTime(timestamp);
}