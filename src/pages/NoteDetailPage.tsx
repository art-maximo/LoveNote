import { Link, useParams } from 'react-router-dom';
import { FileText } from 'lucide-react';
import { NoteEditor } from '../components/notes/NoteEditor';
import { EmptyState } from '../components/ui/EmptyState';
import { ErrorState } from '../components/ui/ErrorState';
import { Skeleton } from '../components/ui/Skeleton';
import { useNotes } from '../hooks/useNotes';
import { friendlyError } from '../lib/errors';

export function NoteDetailPage() {
  const { noteId } = useParams<{ noteId: string }>();
  const notesQuery = useNotes();

  if (notesQuery.isPending) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (notesQuery.isError) {
    return (
      <ErrorState
        message={friendlyError(notesQuery.error, 'Não foi possível carregar a anotação.')}
        onRetry={() => void notesQuery.refetch()}
      />
    );
  }

  const note = notesQuery.data.find((entry) => entry.id === noteId);

  if (!note) {
    return (
      <EmptyState
        icon={FileText}
        title="Anotação não encontrada"
        description="Ela pode ter sido excluída ou o link está incorreto."
      >
        <Link
          to="/notas"
          className="rounded-xl bg-rose-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-rose-600"
        >
          Ver todas as anotações
        </Link>
      </EmptyState>
    );
  }

  // A chave reinicia o editor (e seu rascunho) ao trocar de anotação.
  return <NoteEditor key={note.id} note={note} />;
}