import { useState } from 'react';
import type { FormEvent } from 'react';
import { Plus } from 'lucide-react';

interface AddItemFormProps {
  onAdd: (text: string) => void;
}

export function AddItemForm({ onAdd }: AddItemFormProps) {
  const [text, setText] = useState('');

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = text.trim();
    if (value === '') return;
    onAdd(value);
    // O campo continua focado: dá para digitar vários itens em sequência.
    setText('');
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        type="text"
        value={text}
        maxLength={500}
        onChange={(event) => setText(event.target.value)}
        placeholder="Adicionar item..."
        aria-label="Novo item"
        enterKeyHint="done"
        className="min-w-0 flex-1 rounded-xl border border-stone-300 bg-white px-3.5 py-2.5 text-sm outline-none transition placeholder:text-stone-400 focus:border-rose-400 focus:ring-4 focus:ring-rose-100 dark:border-stone-700 dark:bg-stone-900 dark:placeholder:text-stone-500 dark:focus:ring-rose-400/20"
      />
      <button
        type="submit"
        disabled={text.trim() === ''}
        aria-label="Adicionar item"
        className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-rose-500 text-white shadow-sm transition hover:bg-rose-600 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <Plus className="h-5 w-5" />
      </button>
    </form>
  );
}