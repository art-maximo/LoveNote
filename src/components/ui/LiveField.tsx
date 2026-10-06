import { useRef, useState } from 'react';

interface LiveFieldProps {
  value: string;
  onCommit: (next: string) => void;
  // Chamado quando a pessoa começa a editar (serve para guardar a "versão base").
  onFocusStart?: () => void;
  ariaLabel: string;
  multiline?: boolean;
  maxLength?: number;
  placeholder?: string;
  // Permite salvar vazio (ex.: descrição). Por padrão, vazio é ignorado.
  allowEmpty?: boolean;
  // Somente leitura (sem permissão de edição).
  disabled?: boolean;
  className?: string;
}

const baseClass =
  'w-full rounded-xl border border-transparent bg-transparent px-2.5 py-1.5 outline-none transition placeholder:text-stone-400 hover:border-stone-200 focus:border-rose-400 focus:bg-white focus:ring-4 focus:ring-rose-100 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:border-transparent dark:placeholder:text-stone-500 dark:hover:border-stone-700 dark:focus:bg-stone-950 dark:focus:ring-rose-400/20';

// Campo que mostra sempre o valor mais recente (inclusive o que vem do Realtime)
// enquanto você não está digitando. Ao digitar, guarda um rascunho local e
// só salva ao sair do campo.
export function LiveField({
  value,
  onCommit,
  onFocusStart,
  ariaLabel,
  multiline = false,
  maxLength,
  placeholder,
  allowEmpty = false,
  disabled = false,
  className = '',
}: LiveFieldProps) {
  const [draft, setDraft] = useState<string | null>(null);
  const startRef = useRef(value);
  const shown = draft ?? value;

  function handleFocus() {
    startRef.current = value;
    setDraft(value);
    onFocusStart?.();
  }

  function handleBlur() {
    const next = (draft ?? value).trim();
    setDraft(null);
    if (next === startRef.current.trim()) return;
    if (next === '' && !allowEmpty) return;
    onCommit(next);
  }

  if (multiline) {
    return (
      <textarea
        value={shown}
        rows={4}
        maxLength={maxLength}
        placeholder={placeholder}
        aria-label={ariaLabel}
        disabled={disabled}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onChange={(event) => setDraft(event.target.value)}
        className={`${baseClass} resize-none ${className}`}
      />
    );
  }

  return (
    <input
      type="text"
      value={shown}
      maxLength={maxLength}
      placeholder={placeholder}
      aria-label={ariaLabel}
      disabled={disabled}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onChange={(event) => setDraft(event.target.value)}
      onKeyDown={(event) => {
        if (event.key === 'Enter') {
          event.preventDefault();
          event.currentTarget.blur();
        }
      }}
      className={`${baseClass} ${className}`}
    />
  );
}