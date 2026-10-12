// Planejamento do tipo "Semanal".
// Cada atividade é uma chave própria dentro de plans.data ("e_<id>"),
// assim duas pessoas podem adicionar atividades ao mesmo tempo sem conflito.

export const WEEK_DAYS = [
  { key: 'mon', label: 'Segunda' },
  { key: 'tue', label: 'Terça' },
  { key: 'wed', label: 'Quarta' },
  { key: 'thu', label: 'Quinta' },
  { key: 'fri', label: 'Sexta' },
  { key: 'sat', label: 'Sábado' },
  { key: 'sun', label: 'Domingo' },
] as const;

export type DayKey = (typeof WEEK_DAYS)[number]['key'];

// O que fica guardado dentro da chave
export interface WeeklyEntryValue {
  day: DayKey;
  text: string;
  done: boolean;
  order: number;
}

export interface WeeklyEntry extends WeeklyEntryValue {
  key: string; // chave em plans.data
}

const ENTRY_PREFIX = 'e_';

function isDayKey(value: unknown): value is DayKey {
  return WEEK_DAYS.some((day) => day.key === value);
}

// Valida o valor de uma atividade vindo do banco.
export function parseEntryValue(raw: unknown): WeeklyEntryValue | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const record = raw as Record<string, unknown>;
  const day = record.day;
  const text = record.text;
  if (!isDayKey(day) || typeof text !== 'string') return null;
  return {
    day,
    text,
    done: record.done === true,
    order: typeof record.order === 'number' ? record.order : 0,
  };
}

// Todas as atividades, na ordem em que foram criadas.
export function readWeekly(data: Record<string, unknown>): WeeklyEntry[] {
  const entries: WeeklyEntry[] = [];
  for (const [key, raw] of Object.entries(data)) {
    if (!key.startsWith(ENTRY_PREFIX)) continue;
    const value = parseEntryValue(raw);
    if (value) entries.push({ ...value, key });
  }
  return entries.sort((a, b) => a.order - b.order);
}

// Identificador único para uma nova atividade.
export function makeEntryKey(): string {
  return `${ENTRY_PREFIX}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

// Valor a gravar no banco para uma atividade.
export function toEntryValue(entry: WeeklyEntryValue): WeeklyEntryValue {
  return { day: entry.day, text: entry.text, done: entry.done, order: entry.order };
}