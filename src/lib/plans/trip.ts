// Planejamento do tipo "Viagem".
// Dados guardados em plans.data, uma chave por campo.

export interface TripData {
  destination: string;
  departure_date: string; // AAAA-MM-DD ou vazio
  return_date: string; // AAAA-MM-DD ou vazio
  lodging: string;
  transport: string;
  budget: string;
  notes: string;
}

function asText(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function asDate(value: unknown): string {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : '';
}

// Lê os dados do banco de forma tolerante (campos ausentes viram vazio).
export function readTrip(data: Record<string, unknown>): TripData {
  return {
    destination: asText(data.destination),
    departure_date: asDate(data.departure_date),
    return_date: asDate(data.return_date),
    lodging: asText(data.lodging),
    transport: asText(data.transport),
    budget: asText(data.budget),
    notes: asText(data.notes),
  };
}

export function initialTripData(): Record<string, unknown> {
  return {
    destination: '',
    departure_date: '',
    return_date: '',
    lodging: '',
    transport: '',
    budget: '',
    notes: '',
  };
}

// Nome de cada campo, usado nas mensagens de conflito.
export const TRIP_FIELD_LABELS: Record<string, string> = {
  destination: 'o destino',
  departure_date: 'a data de ida',
  return_date: 'a data de volta',
  lodging: 'a hospedagem',
  transport: 'o transporte',
  budget: 'o orçamento',
  notes: 'as observações',
};