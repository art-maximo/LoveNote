import { useRef, useState } from 'react';

interface InlineEditableTextProps {
  value: string;
  onSave: (next: string) => void;
  // Chamado quando a edição começa (serve para guardar a "versão base").
  onStart?: () => void;
  ariaLabel: string;
  className?: string;
  maxLength?: number;
}

// Texto que vira campo de edição ao clicar.
// Enter ou clicar fora salva; Esc cancela.
export function InlineEditableText({
  value,
  onSave,
  onStart,
  ariaLabel,
  className = '',
  maxLength = 200,
}: InlineEditableTextProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  // Evita salvar duas vezes (Enter + perda de foco ao desmontar o campo).
  const finishedRef = useRef(false);
  // Valor que o campo tinha quando a edição começou.
  const startValueRef = useRef(value);

  function start() {
    finishedRef.current = false;
    startValueRef.current = value;
    setDraft(value);
    setEditing(true);
    onStart?.();
  }

  function commit() {
    if (finishedRef.current) return;
    finishedRef.current = true;
    setEditing(false);
    const next = draft.trim();
    // Só salva se a pessoa realmente mudou algo em relação ao início da edição.
    if (next !== '' && next !== startValueRef.current) onSave(next);
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