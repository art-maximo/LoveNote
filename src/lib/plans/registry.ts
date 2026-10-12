import { CalendarDays, Plane } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { Plan } from '../../types';
import { formatDueDate } from '../../utils/dates';
import { REMOVE_KEY } from './patch';
import { TRIP_FIELD_LABELS, initialTripData, readTrip } from './trip';
import { parseEntryValue, readWeekly } from './weekly';

export type PlanTypeId = 'trip' | 'weekly';

export interface PlanTypeInfo {
  id: PlanTypeId;
  label: string;
  description: string;
  icon: LucideIcon;
  defaultTitle: string;
  // Dados iniciais de um planejamento novo deste tipo
  initialData: () => Record<string, unknown>;
  // Texto curto para o cartão da lista
  summary: (plan: Plan) => string;
  // Data que alimenta os "próximos planejamentos" (ou null)
  startsOn: (plan: Plan) => string | null;
}

// Para criar um tipo novo: defina-o em src/lib/plans/, crie o editor em
// src/components/plans/ e registre aqui e em PlanEditor.tsx. Não há migração de banco.
export const PLAN_TYPES: PlanTypeInfo[] = [
  {
    id: 'trip',
    label: 'Viagem',
    description: 'Destino, datas, hospedagem, transporte e orçamento.',
    icon: Plane,
    defaultTitle: 'Nova viagem',
    initialData: initialTripData,
    summary: (plan) => {
      const trip = readTrip(plan.data);
      const parts: string[] = [];
      if (trip.destination.trim() !== '') parts.push(trip.destination.trim());
      if (trip.departure_date !== '') {
        parts.push(
          trip.return_date !== ''
            ? `${formatDueDate(trip.departure_date)} → ${formatDueDate(trip.return_date)}`
            : formatDueDate(trip.departure_date),
        );
      }
      return parts.length > 0 ? parts.join(' · ') : 'Sem destino nem datas ainda';
    },
    startsOn: (plan) => {
      const departure = readTrip(plan.data).departure_date;
      return departure === '' ? null : departure;
    },
  },
  {
    id: 'weekly',
    label: 'Semanal',
    description: 'Atividades de segunda a domingo, com marcação de concluídas.',
    icon: CalendarDays,
    defaultTitle: 'Planejamento da semana',
    initialData: () => ({}),
    summary: (plan) => {
      const entries = readWeekly(plan.data);
      if (entries.length === 0) return 'Nenhuma atividade ainda';
      const done = entries.filter((entry) => entry.done).length;
      return `${done} de ${entries.length} atividades concluídas`;
    },
    startsOn: () => null,
  },
];

export function getPlanType(type: string): PlanTypeInfo | null {
  return PLAN_TYPES.find((info) => info.id === type) ?? null;
}

// --- Textos das mensagens de conflito ---
// key: "title" ou "data.<chave>"

export function planKeyLabel(type: string, key: string): string {
  if (key === 'title') return 'o título do planejamento';
  if (key.startsWith('data.')) {
    const field = key.slice('data.'.length);
    if (type === 'trip') return TRIP_FIELD_LABELS[field] ?? 'este campo';
    if (type === 'weekly') return 'uma atividade da semana';
  }
  return 'este campo';
}

export function planValueText(type: string, value: unknown): string {
  if (value === undefined || value === REMOVE_KEY) return '(removido)';
  if (type === 'weekly') {
    const entry = parseEntryValue(value);
    return entry ? entry.text : '';
  }
  if (typeof value === 'string') {
    return /^\d{4}-\d{2}-\d{2}$/.test(value) ? formatDueDate(value) : value;
  }
  return String(value);
}