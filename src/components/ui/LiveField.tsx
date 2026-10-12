import { useEffect, useRef, useState } from 'react';

interface LiveFieldProps {
  value: string;
  onCommit: (next: string) => void;
  // Chamado quando a pessoa começa a editar (serve para guardar a "versão base").
  onFocusStart?: () => void;
  // Chamado quando a pessoa sai do campo (depois de salvar, se houve alteração).
  onFocusEnd?: () => void;
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
  onFocusEnd,
  ariaLabel,
  multiline = false,
  maxLength,
  placeholder,
  allowEmpty = false,
  disabled = false,
  className = '',
}: LiveFieldProps) {
  const [draft, setDraft] = useState<string | null>(null);
  const draftRef = useRef<string | null>(null);
  const startRef = useRef(value);
  const shown = draft ?? value;

  // Sempre apontam para as versões mais recentes (usadas ao desmontar).
  const commitRef = useRef(onCommit);
  const allowEmptyRef = useRef(allowEmpty);
  useEffect(() => {
    commitRef.current = onCommit;
    allowEmptyRef.current = allowEmpty;
  });

  function updateDraft(next: string | null) {
    draftRef.current = next;
    setDraft(next);
  }

  // Rede de proteção: se o campo sumir da tela no meio da digitação (por exemplo,
  // a outra pessoa removeu o item), o que foi digitado não se perde em silêncio.
  useEffect(() => {
    return () => {
      const pending = draftRef.current;
      if (pending === null) return;
      const next = pending.trim();
      if (next === startRef.current.trim()) return;
      if (next === '' && !allowEmptyRef.current) return;
      commitRef.current(next);
    };
  }, []);

  function handleFocus() {
    startRef.current = value;
    updateDraft(value);
    onFocusStart?.();
  }

  function handleBlur() {
    const next = (draft ?? value).trim();
    updateDraft(null);
    const changed = next !== startRef.current.trim() && (next !== '' || allowEmpty);
    if (changed) onCommit(next);
    onFocusEnd?.();
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
        onChange={(event) => updateDraft(event.target.value)}
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
      onChange={(event) => updateDraft(event.target.value)}
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