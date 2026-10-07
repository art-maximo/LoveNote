import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Plus, Search } from 'lucide-react';
import { NoteCard } from '../components/notes/NoteCard';
import { EmptyState } from '../components/ui/EmptyState';
import { ErrorState } from '../components/ui/ErrorState';
import { Skeleton } from '../components/ui/Skeleton';
import { Spinner } from '../components/ui/Spinner';
import { useAuth } from '../hooks/useAuth';
import { useCreateNote, useNotes } from '../hooks/useNotes';
import { friendlyError } from '../lib/errors';

export function NotesPage() {
  const navigate = useNavigate();
  const { profile, partner } = useAuth();
  const notesQuery = useNotes();
  const createNote = useCreateNote();
  const [search, setSearch] = useState('');

  const notes = notesQuery.data;

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (notes ?? [])
      .filter(
        (note) =>
          term === '' ||
          note.title.toLowerCase().includes(term) ||
          note.content.toLowerCase().includes(term),
      )
      .sort((a, b) => b.updated_at.localeCompare(a.updated_at));
  }, [notes, search]);

  function editorName(id: string | null): string {
    if (id && id === profile?.id) return 'você';
    if (id && id === partner?.id) return partner.display_name;
    return 'alguém';
  }

  function handleCreate() {
    createNote.mutate(undefined, {
      onSuccess: (note) => navigate(`/notas/${note.id}`),
    });
  }

  return (
    <div>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Anotações</h1>
          <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
            Ideias, planos, lembretes... escritos juntos.
          </p>
        </div>
        <button
          type="button"
          onClick={handleCreate}
          disabled={createNote.isPending}
          className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-rose-500 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-rose-600 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {createNote.isPending ? <Spinner className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          Nova
        </button>
      </div>

      {(notes ?? []).length > 0 && (
        <div className="relative mt-6">
          <Search
            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400"
            aria-hidden="true"
          />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar nas anotações..."
            aria-label="Buscar nas anotações"
            className="w-full rounded-xl border border-stone-300 bg-white py-2.5 pl-10 pr-3.5 text-sm outline-none transition placeholder:text-stone-400 focus:border-rose-400 focus:ring-4 focus:ring-rose-100 dark:border-stone-700 dark:bg-stone-900 dark:placeholder:text-stone-500 dark:focus:ring-rose-400/20"
          />
        </div>
      )}

      <div className="mt-6">
        {notesQuery.isPending ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <Skeleton className="h-28" />
            <Skeleton className="h-28" />
          </div>
        ) : notesQuery.isError ? (
          <ErrorState
            message={friendlyError(notesQuery.error, 'Não foi possível carregar as anotações.')}
            onRetry={() => void notesQuery.refetch()}
          />
        ) : (notes ?? []).length === 0 ? (
          <EmptyState
            icon={FileText}
            title="Nenhuma anotação ainda"
            description="Crie a primeira. Por exemplo: Ideias para nossa viagem."
          />
        ) : visible.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="Nada encontrado"
            description="Nenhuma anotação combina com a sua busca."
          />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {visible.map((note) => (
              <NoteCard key={note.id} note={note} editorName={editorName(note.updated_by)} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}