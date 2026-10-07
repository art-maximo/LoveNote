import type { NoteConflict } from '../../hooks/useNoteAutosave';

interface NoteConflictPanelProps {
  partnerName: string;
  conflict: NoteConflict;
  // O que você escreveu (versão mais recente da sua tela)
  mine: string;
  onKeepMine: () => void;
  onAcceptTheirs: () => void;
  onSaveCopy: () => void;
}

function Preview({ label, text }: { label: string; text: string }) {
  const shown = text.length > 800 ? `${text.slice(0, 800)}...` : text;
  return (
    <div className="min-w-0">
      <p className="mb-1 text-xs font-medium text-stone-600 dark:text-stone-300">{label}</p>
      <div className="max-h-40 overflow-auto whitespace-pre-wrap break-words rounded-lg bg-white p-2 text-xs text-stone-700 dark:bg-stone-950 dark:text-stone-300">
        {shown === '' ? '(vazio)' : shown}
      </div>
    </div>
  );
}

const buttonBase =
  'rounded-xl px-3.5 py-2 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-4';

export function NoteConflictPanel({
  partnerName,
  conflict,
  mine,
  onKeepMine,
  onAcceptTheirs,
  onSaveCopy,
}: NoteConflictPanelProps) {
  const fieldLabel = conflict.field === 'title' ? 'o título' : 'o texto';
  const theirs = conflict.field === 'title' ? conflict.server.title : conflict.server.content;

  return (
    <div
      role="alert"
      className="mb-5 rounded-2xl border border-amber-300 bg-amber-50 p-4 dark:border-amber-500/40 dark:bg-amber-500/10"
    >
      <h2 className="text-sm font-semibold text-amber-900 dark:text-amber-200">
        {partnerName} alterou {fieldLabel} ao mesmo tempo
      </h2>
      <p className="mt-1 text-xs text-amber-800 dark:text-amber-300">
        Nada foi sobrescrito. Sua versão continua na tela. Escolha o que fazer:
      </p>

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <Preview label="Sua versão" text={mine} />
        <Preview label={`Versão de ${partnerName}`} text={theirs} />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onKeepMine}
          className={`${buttonBase} bg-rose-500 text-white hover:bg-rose-600 focus-visible:ring-rose-200`}
        >
          Manter a minha
        </button>
        <button
          type="button"
          onClick={onAcceptTheirs}
          className={`${buttonBase} border border-stone-300 bg-white text-stone-700 hover:bg-stone-100 focus-visible:ring-stone-200 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200 dark:hover:bg-stone-800`}
        >
          Usar a dela
        </button>
        {conflict.field === 'content' && (
          <button
            type="button"
            onClick={onSaveCopy}
            className={`${buttonBase} border border-stone-300 bg-white text-stone-700 hover:bg-stone-100 focus-visible:ring-stone-200 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200 dark:hover:bg-stone-800`}
          >
            Salvar a minha como nova anotação
          </button>
        )}
      </div>
    </div>
  );
}