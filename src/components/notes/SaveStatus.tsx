import { Spinner } from '../ui/Spinner';
import type { SaveStatus as SaveStatusValue } from '../../hooks/useNoteAutosave';

interface SaveStatusProps {
  status: SaveStatusValue;
  onRetry: () => void;
}

function Dot({ className }: { className: string }) {
  return <span className={`h-2 w-2 rounded-full ${className}`} aria-hidden="true" />;
}

export function SaveStatus({ status, onRetry }: SaveStatusProps) {
  let content;

  switch (status) {
    case 'saving':
      content = (
        <>
          <Spinner className="h-3.5 w-3.5" />
          Salvando...
        </>
      );
      break;
    case 'dirty':
      content = (
        <>
          <Dot className="bg-amber-400" />
          Alterações pendentes
        </>
      );
      break;
    case 'offline':
      content = (
        <>
          <Dot className="bg-red-500" />
          Sem conexão: salvaremos quando voltar
        </>
      );
      break;
    case 'error':
      content = (
        <>
          <Dot className="bg-red-500" />
          Erro ao salvar
          <button
            type="button"
            onClick={onRetry}
            className="font-medium text-rose-600 underline underline-offset-2 dark:text-rose-400"
          >
            Tentar de novo
          </button>
        </>
      );
      break;
    case 'conflict':
      content = (
        <>
          <Dot className="bg-amber-400" />
          Conflito para resolver
        </>
      );
      break;
    default:
      content = (
        <>
          <Dot className="bg-emerald-500" />
          Salvo
        </>
      );
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className="flex items-center gap-1.5 text-xs text-stone-500 dark:text-stone-400"
    >
      {content}
    </div>
  );
}