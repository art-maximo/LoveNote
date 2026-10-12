import { useCallback, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { Check, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { LiveField } from '../ui/LiveField';
import { useAuth } from '../../hooks/useAuth';
import { REMOVE_KEY } from '../../lib/plans/patch';
import type { PlanPatch } from '../../lib/plans/patch';
import { WEEK_DAYS, makeEntryKey, readWeekly, toEntryValue } from '../../lib/plans/weekly';
import type { DayKey, WeeklyEntry } from '../../lib/plans/weekly';
import type { Plan } from '../../types';

type OnPatch = (base: Plan, patch: PlanPatch, force?: boolean) => void;

// Atividade mostrada na tela. "removed" = a outra pessoa a removeu enquanto
// você a edita: ela fica visível até você terminar, para nada se perder.
interface DisplayEntry extends WeeklyEntry {
  removed: boolean;
}

interface WeeklyEditorProps {
  plan: Plan;
  onPatch: OnPatch;
}

interface EntryRowProps {
  plan: Plan;
  entry: DisplayEntry;
  partnerName: string;
  onPatch: OnPatch;
  onEditStart: (entry: WeeklyEntry) => void;
  onEditEnd: (key: string) => void;
}

function EntryRow({ plan, entry, partnerName, onPatch, onEditStart, onEditEnd }: EntryRowProps) {
  // O planejamento como estava quando a pessoa começou a editar o texto.
  const baseRef = useRef<Plan>(plan);

  function toggle() {
    onPatch(plan, { data: { [entry.key]: { ...toEntryValue(entry), done: !entry.done } } });
  }

  function remove() {
    const previous = toEntryValue(entry);
    onPatch(plan, { data: { [entry.key]: REMOVE_KEY } });
    toast('Atividade removida.', {
      action: {
        label: 'Desfazer',
        // A própria pessoa removeu: pode gravar de volta sem checar conflito.
        onClick: () => onPatch(plan, { data: { [entry.key]: previous } }, true),
      },
    });
  }

  return (
    <li
      className={
        entry.removed ? 'rounded-lg bg-amber-50 dark:bg-amber-500/10' : undefined
      }
    >
      <div className="flex items-center gap-1">
        <button
          type="button"
          role="checkbox"
          aria-checked={entry.done}
          aria-label={entry.done ? 'Marcar como pendente' : 'Marcar como concluída'}
          disabled={entry.removed}
          onClick={toggle}
          className="flex h-9 w-9 shrink-0 items-center justify-center disabled:cursor-not-allowed disabled:opacity-50"
        >
          <span
            className={`flex h-5 w-5 items-center justify-center rounded-full border-2 transition ${
              entry.done
                ? 'border-rose-500 bg-rose-500 text-white'
                : 'border-stone-300 dark:border-stone-600'
            }`}
          >
            {entry.done && <Check className="h-3 w-3" strokeWidth={3} />}
          </span>
        </button>

        <div className="min-w-0 flex-1">
          <LiveField
            ariaLabel="Texto da atividade"
            value={entry.text}
            maxLength={200}
            className={`py-1 text-sm ${
              entry.done ? 'text-stone-400 line-through dark:text-stone-500' : ''
            }`}
            onFocusStart={() => {
              baseRef.current = plan;
              onEditStart(entry);
            }}
            onFocusEnd={() => onEditEnd(entry.key)}
            onCommit={(text) =>
              onPatch(baseRef.current, {
                data: { [entry.key]: { ...toEntryValue(entry), text } },
              })
            }
          />
        </div>

        <button
          type="button"
          onClick={remove}
          disabled={entry.removed}
          aria-label="Remover atividade"
          title="Remover atividade"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-stone-400 transition hover:bg-stone-100 hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-stone-800"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      {entry.removed && (
        <p className="px-3 pb-2 text-xs text-amber-800 dark:text-amber-300">
          {partnerName} removeu esta atividade. Quando você terminar de editar, poderá
          escolher o que fazer.
        </p>
      )}
    </li>
  );
}

interface DaySectionProps {
  plan: Plan;
  day: DayKey;
  label: string;
  entries: DisplayEntry[];
  partnerName: string;
  onPatch: OnPatch;
  onEditStart: (entry: WeeklyEntry) => void;
  onEditEnd: (key: string) => void;
}

function DaySection({
  plan,
  day,
  label,
  entries,
  partnerName,
  onPatch,
  onEditStart,
  onEditEnd,
}: DaySectionProps) {
  const [text, setText] = useState('');

  function handleAdd(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = text.trim();
    if (value === '') return;
    onPatch(plan, {
      data: {
        [makeEntryKey()]: toEntryValue({ day, text: value, done: false, order: Date.now() }),
      },
    });
    setText('');
  }

  const active = entries.filter((entry) => !entry.removed);
  const doneCount = active.filter((entry) => entry.done).length;

  return (
    <section className="rounded-2xl border border-stone-200 bg-white p-3 dark:border-stone-800 dark:bg-stone-900">
      <div className="mb-2 flex items-baseline justify-between px-1">
        <h2 className="text-sm font-semibold">{label}</h2>
        {active.length > 0 && (
          <span className="text-xs text-stone-400">
            {doneCount}/{active.length}
          </span>
        )}
      </div>

      {entries.length > 0 && (
        <ul className="mb-2 space-y-0.5">
          {entries.map((entry) => (
            <EntryRow
              key={entry.key}
              plan={plan}
              entry={entry}
              partnerName={partnerName}
              onPatch={onPatch}
              onEditStart={onEditStart}
              onEditEnd={onEditEnd}
            />
          ))}
        </ul>
      )}

      <form onSubmit={handleAdd} className="flex gap-2">
        <input
          type="text"
          value={text}
          maxLength={200}
          onChange={(event) => setText(event.target.value)}
          placeholder="Adicionar atividade..."
          aria-label={`Nova atividade de ${label}`}
          enterKeyHint="done"
          className="min-w-0 flex-1 rounded-xl border border-stone-200 bg-transparent px-3 py-2 text-sm outline-none transition placeholder:text-stone-400 focus:border-rose-400 focus:ring-4 focus:ring-rose-100 dark:border-stone-800 dark:placeholder:text-stone-500 dark:focus:ring-rose-400/20"
        />
        <button
          type="submit"
          disabled={text.trim() === ''}
          aria-label={`Adicionar atividade em ${label}`}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-500 text-white transition hover:bg-rose-600 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Plus className="h-4 w-4" />
        </button>
      </form>
    </section>
  );
}

export function WeeklyEditor({ plan, onPatch }: WeeklyEditorProps) {
  const { partner } = useAuth();
  const partnerName = partner?.display_name ?? 'A outra pessoa';

  // Atividades em edição. Se a outra pessoa remover uma delas nesse meio tempo,
  // ela continua na tela até a pessoa terminar de editar.
  const [pinned, setPinned] = useState<Record<string, WeeklyEntry>>({});

  const handleEditStart = useCallback((entry: WeeklyEntry) => {
    setPinned((previous) => ({ ...previous, [entry.key]: entry }));
  }, []);

  const handleEditEnd = useCallback((key: string) => {
    setPinned((previous) => {
      if (!(key in previous)) return previous;
      const next = { ...previous };
      delete next[key];
      return next;
    });
  }, []);

  const serverEntries = readWeekly(plan.data);
  const serverKeys = new Set(serverEntries.map((entry) => entry.key));
  const ghosts = Object.values(pinned).filter((entry) => !serverKeys.has(entry.key));

  const entries: DisplayEntry[] = [
    ...serverEntries.map((entry) => ({ ...entry, removed: false })),
    ...ghosts.map((entry) => ({ ...entry, removed: true })),
  ].sort((a, b) => a.order - b.order);

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {WEEK_DAYS.map((day) => (
        <DaySection
          key={day.key}
          plan={plan}
          day={day.key}
          label={day.label}
          entries={entries.filter((entry) => entry.day === day.key)}
          partnerName={partnerName}
          onPatch={onPatch}
          onEditStart={handleEditStart}
          onEditEnd={handleEditEnd}
        />
      ))}
    </div>
  );
}