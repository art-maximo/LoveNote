interface SegmentedOption<T extends string> {
  value: T;
  label: string;
}

interface SegmentedProps<T extends string> {
  value: T;
  options: ReadonlyArray<SegmentedOption<T>>;
  onChange: (value: T) => void;
  ariaLabel: string;
}

// Seletor em "pílulas" (ex.: Pendentes / Concluídas / Todas).
export function Segmented<T extends string>({
  value,
  options,
  onChange,
  ariaLabel,
}: SegmentedProps<T>) {
  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className="inline-flex max-w-full overflow-x-auto rounded-xl bg-stone-200/70 p-0.5 dark:bg-stone-800"
    >
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(option.value)}
            className={`whitespace-nowrap rounded-[10px] px-3 py-1.5 text-sm font-medium transition ${
              active
                ? 'bg-white text-stone-900 shadow-sm dark:bg-stone-950 dark:text-stone-100'
                : 'text-stone-600 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-200'
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}