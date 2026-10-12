import { useRef } from 'react';
import { LiveField } from '../ui/LiveField';
import { readTrip } from '../../lib/plans/trip';
import type { TripData } from '../../lib/plans/trip';
import type { PlanPatch } from '../../lib/plans/patch';
import type { Plan } from '../../types';
import { daysUntil, nightsBetween } from '../../utils/dates';

interface TripEditorProps {
  plan: Plan;
  onPatch: (base: Plan, patch: PlanPatch, force?: boolean) => void;
}

type TextField = 'destination' | 'lodging' | 'transport' | 'budget';

const fieldBox =
  'border-stone-200 text-sm dark:border-stone-800';

const labelClass = 'mb-1 block text-xs font-medium text-stone-500 dark:text-stone-400';

interface DateFieldProps {
  id: string;
  label: string;
  value: string;
  onPick: (value: string) => void;
  onClear: () => void;
}

function DateField({ id, label, value, onPick, onClear }: DateFieldProps) {
  return (
    <div>
      <label htmlFor={id} className={labelClass}>
        {label}
      </label>
      <div className="flex items-center gap-2">
        {/* Campo não controlado: não atrapalha a digitação da data. A chave faz
            o campo refletir mudanças vindas do outro aparelho. */}
        <input
          key={`${id}-${value === '' ? 'none' : value}`}
          id={id}
          type="date"
          min="2000-01-01"
          max="2100-12-31"
          defaultValue={value}
          onChange={(event) => {
            const next = event.target.value;
            if (next === '' || next === value) return;
            const year = Number(next.slice(0, 4));
            if (year < 2000 || year > 2100) return;
            onPick(next);
          }}
          className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-rose-400 focus:ring-4 focus:ring-rose-100 dark:border-stone-700 dark:bg-stone-950 dark:focus:ring-rose-400/20"
        />
        {value !== '' && (
          <button
            type="button"
            onClick={onClear}
            className="shrink-0 rounded-xl border border-stone-300 px-3 py-2 text-sm font-medium text-stone-600 transition hover:bg-stone-100 dark:border-stone-700 dark:text-stone-300 dark:hover:bg-stone-800"
          >
            Limpar
          </button>
        )}
      </div>
    </div>
  );
}

const TEXT_FIELDS: Array<{ field: TextField; label: string; placeholder: string }> = [
  { field: 'destination', label: 'Destino', placeholder: 'Para onde vamos?' },
  { field: 'lodging', label: 'Hospedagem', placeholder: 'Hotel, pousada, apartamento...' },
  { field: 'transport', label: 'Transporte', placeholder: 'Avião, carro, ônibus...' },
  { field: 'budget', label: 'Orçamento', placeholder: 'Ex.: R$ 3.500' },
];

export function TripEditor({ plan, onPatch }: TripEditorProps) {
  const trip: TripData = readTrip(plan.data);
  // O planejamento como estava quando a pessoa começou a editar o campo.
  const baseRef = useRef<Plan>(plan);
  const markBase = () => {
    baseRef.current = plan;
  };

  function commitText(field: TextField | 'notes', next: string) {
    onPatch(baseRef.current, { data: { [field]: next } });
  }

  const hasBoth = trip.departure_date !== '' && trip.return_date !== '';
  const nights = hasBoth ? nightsBetween(trip.departure_date, trip.return_date) : null;
  const until = trip.departure_date !== '' ? daysUntil(trip.departure_date) : null;

  const hints: string[] = [];
  if (nights !== null && nights >= 0) {
    hints.push(`${nights} ${nights === 1 ? 'noite' : 'noites'}`);
  }
  if (until !== null && until > 0) {
    hints.push(`Faltam ${until} ${until === 1 ? 'dia' : 'dias'}`);
  }
  if (until === 0) hints.push('A viagem começa hoje');

  const destination = TEXT_FIELDS[0];
  const others = TEXT_FIELDS.slice(1);

  return (
    <div className="space-y-5">
      {hints.length > 0 && (
        <p className="text-sm font-medium text-rose-600 dark:text-rose-400">{hints.join(' · ')}</p>
      )}

      <div>
        <span className={labelClass}>{destination.label}</span>
        <LiveField
          ariaLabel={destination.label}
          placeholder={destination.placeholder}
          value={trip[destination.field]}
          maxLength={200}
          allowEmpty
          className={fieldBox}
          onFocusStart={markBase}
          onCommit={(next) => commitText(destination.field, next)}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <DateField
          id="trip-departure"
          label="Data de ida"
          value={trip.departure_date}
          onPick={(value) =>
            onPatch(plan, { data: { departure_date: value }, starts_on: value })
          }
          onClear={() => onPatch(plan, { data: { departure_date: '' }, starts_on: null })}
        />
        <DateField
          id="trip-return"
          label="Data de volta"
          value={trip.return_date}
          onPick={(value) => onPatch(plan, { data: { return_date: value } })}
          onClear={() => onPatch(plan, { data: { return_date: '' } })}
        />
      </div>

      {nights !== null && nights < 0 && (
        <p
          role="alert"
          className="rounded-xl bg-amber-50 px-3.5 py-2.5 text-sm text-amber-800 dark:bg-amber-500/10 dark:text-amber-300"
        >
          A data de volta está antes da data de ida.
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {others.map((entry) => (
          <div key={entry.field}>
            <span className={labelClass}>{entry.label}</span>
            <LiveField
              ariaLabel={entry.label}
              placeholder={entry.placeholder}
              value={trip[entry.field]}
              maxLength={200}
              allowEmpty
              className={fieldBox}
              onFocusStart={markBase}
              onCommit={(next) => commitText(entry.field, next)}
            />
          </div>
        ))}
      </div>

      <div>
        <span className={labelClass}>Observações</span>
        <LiveField
          multiline
          allowEmpty
          ariaLabel="Observações"
          placeholder="Roteiro, reservas, documentos, o que levar..."
          value={trip.notes}
          maxLength={5000}
          className={fieldBox}
          onFocusStart={markBase}
          onCommit={(next) => commitText('notes', next)}
        />
      </div>
    </div>
  );
}