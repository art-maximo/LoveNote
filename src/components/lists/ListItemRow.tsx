import { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Check, GripVertical, StickyNote, Trash2 } from 'lucide-react';
import { InlineEditableText } from '../ui/InlineEditableText';
import type { ItemChanges, ListItem } from '../../types';

interface ListItemRowProps {
  item: ListItem;
  onChange: (changes: ItemChanges) => void;
  onDelete: () => void;
}

export function ListItemRow({ item, onChange, onDelete }: ListItemRowProps) {
  const [noteOpen, setNoteOpen] = useState(false);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={`rounded-xl border bg-white px-1.5 py-1.5 dark:bg-stone-900 ${
        isDragging
          ? 'relative z-10 border-rose-300 shadow-lg dark:border-rose-500/60'
          : 'border-stone-200 dark:border-stone-800'
      }`}
    >
      <div className="flex items-start gap-0.5">
        <button
          type="button"
          {...attributes}
          {...listeners}
          aria-label="Arrastar para reordenar"
          className="flex h-9 w-7 shrink-0 cursor-grab touch-none items-center justify-center text-stone-300 transition hover:text-stone-500 active:cursor-grabbing dark:text-stone-600 dark:hover:text-stone-400"
        >
          <GripVertical className="h-4 w-4" />
        </button>

        <button
          type="button"
          role="checkbox"
          aria-checked={item.is_done}
          aria-label={item.is_done ? 'Desmarcar item' : 'Marcar item como concluído'}
          onClick={() => onChange({ is_done: !item.is_done })}
          className="flex h-9 w-9 shrink-0 items-center justify-center"
        >
          <span
            className={`flex h-5 w-5 items-center justify-center rounded-full border-2 transition ${
              item.is_done
                ? 'border-rose-500 bg-rose-500 text-white'
                : 'border-stone-300 dark:border-stone-600'
            }`}
          >
            {item.is_done && <Check className="h-3 w-3" strokeWidth={3} />}
          </span>
        </button>

        <div className="min-w-0 flex-1 py-1.5">
          <InlineEditableText
            value={item.text}
            ariaLabel="Texto do item"
            maxLength={500}
            onSave={(text) => onChange({ text })}
            className={`text-sm leading-6 ${
              item.is_done ? 'text-stone-400 line-through dark:text-stone-500' : ''
            }`}
          />

          {noteOpen ? (
            <textarea
              autoFocus
              defaultValue={item.note ?? ''}
              rows={2}
              maxLength={2000}
              placeholder="Observação..."
              aria-label="Observação do item"
              onBlur={(event) => {
                const value = event.target.value.trim();
                setNoteOpen(false);
                const next = value === '' ? null : value;
                if (next !== item.note) onChange({ note: next });
              }}
              className="mt-1 w-full resize-none rounded-lg border border-stone-300 bg-stone-50 px-2.5 py-1.5 text-sm outline-none focus:border-rose-400 focus:ring-4 focus:ring-rose-100 dark:border-stone-700 dark:bg-stone-950 dark:focus:ring-rose-400/20"
            />
          ) : (
            item.note && (
              <button
                type="button"
                onClick={() => setNoteOpen(true)}
                title="Editar observação"
                className="mt-0.5 block w-full whitespace-pre-wrap break-words text-left text-xs text-stone-500 hover:text-stone-700 dark:text-stone-400 dark:hover:text-stone-200"
              >
                {item.note}
              </button>
            )
          )}
        </div>

        <div className="flex shrink-0 items-center">
          <button
            type="button"
            onClick={() => setNoteOpen((open) => !open)}
            aria-label="Observação"
            title="Observação"
            className={`flex h-9 w-9 items-center justify-center rounded-lg transition hover:bg-stone-100 dark:hover:bg-stone-800 ${
              item.note ? 'text-rose-500' : 'text-stone-400'
            }`}
          >
            <StickyNote className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onDelete}
            aria-label="Remover item"
            title="Remover item"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-stone-400 transition hover:bg-stone-100 hover:text-rose-600 dark:hover:bg-stone-800"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </li>
  );
}