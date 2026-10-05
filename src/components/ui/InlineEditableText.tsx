import { useRef, useState } from 'react';

interface InlineEditableTextProps {
  value: string;
  onSave: (next: string) => void;
  ariaLabel: string;
  className?: string;
  maxLength?: number;
}

// Texto que vira campo de edição ao clicar.
// Enter ou clicar fora salva; Esc cancela.
export function InlineEditableText({
  value,
  onSave,
  ariaLabel,
  className = '',
  maxLength = 200,
}: InlineEditableTextProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  // Evita salvar duas vezes (Enter + perda de foco ao desmontar o campo).
  const finishedRef = useRef(false);

  function start() {
    finishedRef.current = false;
    setDraft(value);
    setEditing(true);
  }

  function commit() {
    if (finishedRef.current) return;
    finishedRef.current = true;
    setEditing(false);
    const next = draft.trim();
    if (next !== '' && next !== value) onSave(next);
  }

  function cancel() {
    finishedRef.current = true;
    setEditing(false);
  }

  if (!editing) {
    return (
      <button
        type="button"
        onClick={start}
        title="Clique para editar"
        className={`block w-full break-words rounded-lg text-left transition hover:bg-stone-100 dark:hover:bg-stone-800/60 ${className}`}
      >
        {value}
      </button>
    );
  }

  return (
    <input
      autoFocus
      value={draft}
      maxLength={maxLength}
      aria-label={ariaLabel}
      onChange={(event) => setDraft(event.target.value)}
      onFocus={(event) => event.currentTarget.select()}
      onBlur={commit}
      onKeyDown={(event) => {
        if (event.key === 'Enter') {
          event.preventDefault();
          commit();
        } else if (event.key === 'Escape') {
          cancel();
        }
      }}
      className={`w-full border-0 border-b-2 border-rose-400 bg-transparent p-0 outline-none ${className}`}
    />
  );
}