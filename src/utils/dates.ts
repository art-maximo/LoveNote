function pad(value: number): string {
  return String(value).padStart(2, '0');
}

// Data local no formato AAAA-MM-DD (sem converter para UTC).
export function toISODate(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function todayISO(): string {
  return toISODate(new Date());
}

function parseISODate(iso: string): Date {
  const [year, month, day] = iso.split('-').map(Number);
  return new Date(year, month - 1, day);
}

// "Hoje", "Amanhã", "Ontem" ou "12 out" (com o ano se não for o atual).
export function formatDueDate(iso: string): string {
  const today = todayISO();
  if (iso === today) return 'Hoje';

  const date = parseISODate(iso);
  const diffDays = Math.round(
    (date.getTime() - parseISODate(today).getTime()) / 86_400_000,
  );
  if (diffDays === 1) return 'Amanhã';
  if (diffDays === -1) return 'Ontem';

  const sameYear = date.getFullYear() === new Date().getFullYear();
  return date
    .toLocaleDateString(
      'pt-BR',
      sameYear
        ? { day: 'numeric', month: 'short' }
        : { day: 'numeric', month: 'short', year: 'numeric' },
    )
    .replace(/ de /g, ' ');
}

// Atrasada: prazo anterior a hoje e ainda não concluída.
export function isOverdue(dueDate: string | null, done: boolean): boolean {
  return dueDate !== null && !done && dueDate < todayISO();
}

// Quantos dias faltam de hoje até a data (negativo se já passou).
export function daysUntil(iso: string): number {
  return Math.round(
    (parseISODate(iso).getTime() - parseISODate(todayISO()).getTime()) / 86_400_000,
  );
}

// Noites entre duas datas (volta menos ida).
export function nightsBetween(startIso: string, endIso: string): number {
  return Math.round(
    (parseISODate(endIso).getTime() - parseISODate(startIso).getTime()) / 86_400_000,
  );
}

// Data e hora de um timestamp do banco, ex.: "12 de out., 14:30".
export function formatDateTime(timestamp: string): string {
  return new Date(timestamp).toLocaleString('pt-BR', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}