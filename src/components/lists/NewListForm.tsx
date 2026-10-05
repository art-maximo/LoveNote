import { useState } from 'react';
import type { FormEvent } from 'react';
import { Plus } from 'lucide-react';
import { Spinner } from '../ui/Spinner';

interface NewListFormProps {
  onCreate: (title: string) => void;
  pending: boolean;
}

export function NewListForm({ onCreate, pending }: NewListFormProps) {
  const [title, setTitle] = useState('');

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = title.trim();
    if (value === '' || pending) return;
    onCreate(value);
    setTitle('');
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        type="text"
        value={title}
        maxLength={200}
        onChange={(event) => setTitle(event.target.value)}
        placeholder="Nome da nova lista (ex.: Compras)"
        aria-label="Nome da nova lista"
        className="min-w-0 flex-1 rounded-xl border border-stone-300 bg-white px-3.5 py-2.5 text-sm outline-none transition placeholder:text-stone-400 focus:border-rose-400 focus:ring-4 focus:ring-rose-100 dark:border-stone-700 dark:bg-stone-900 dark:placeholder:text-stone-500 dark:focus:ring-rose-400/20"
      />
      <button
        type="submit"
        disabled={pending || title.trim() === ''}
        className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-rose-500 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-rose-600 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? <Spinner className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
        Criar
      </button>
    </form>
  );
}