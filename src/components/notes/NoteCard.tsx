import { Link } from 'react-router-dom';
import type { Note } from '../../types';
import { formatDateTime } from '../../utils/dates';

interface NoteCardProps {
  note: Note;
  // Nome de quem fez a última edição ("você", "Maria"...)
  editorName: string;
}

export function NoteCard({ note, editorName }: NoteCardProps) {
  const title = note.title.trim() === '' ? 'Sem título' : note.title;
  const snippet = note.content.replace(/\s+/g, ' ').trim().slice(0, 140);

  return (
    <Link
      to={`/notas/${note.id}`}
      className="block rounded-2xl border border-stone-200 bg-white p-4 transition hover:border-rose-300 hover:shadow-sm focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-rose-200 dark:border-stone-800 dark:bg-stone-900 dark:hover:border-rose-500/50 dark:focus-visible:ring-rose-400/30"
    >
      <h2 className="truncate font-medium">{title}</h2>
      <p className="mt-1 line-clamp-2 min-h-10 break-words text-sm text-stone-500 dark:text-stone-400">
        {snippet === '' ? 'Anotação vazia' : snippet}
      </p>
      <p className="mt-3 text-xs text-stone-400 dark:text-stone-500">
        {formatDateTime(note.updated_at)} · {editorName}
      </p>
    </Link>
  );
}