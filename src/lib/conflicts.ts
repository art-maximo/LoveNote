import { toast } from 'sonner';

const FIELD_LABELS: Record<string, string> = {
  text: 'o texto do item',
  note: 'a observação',
  is_done: 'o status do item',
  title: 'o nome da lista',
};

function formatValue(value: unknown): string {
  if (value === null || value === undefined || value === '') return '(vazio)';
  if (typeof value === 'boolean') return value ? 'concluído' : 'pendente';
  const text = String(value);
  return text.length > 80 ? `${text.slice(0, 77)}...` : text;
}

interface ConflictInfo {
  partnerName: string;
  field: string;
  // Texto do campo para a mensagem (ex.: "o prazo"). Se omitido, usa o padrão.
  fieldLabel?: string;
  mine: unknown;
  theirs: unknown;
  onUseMine: () => void;
}

// Aviso que fica na tela até a pessoa escolher. Nada é perdido em silêncio:
// a versão da outra pessoa já está na tela e a sua só é aplicada se você pedir.
export function notifyConflict(info: ConflictInfo): void {
  const label = info.fieldLabel ?? FIELD_LABELS[info.field] ?? 'este campo';

  toast.warning(`${info.partnerName} alterou ${label} ao mesmo tempo`, {
    description: `Sua versão: "${formatValue(info.mine)}". Versão dela: "${formatValue(info.theirs)}".`,
    duration: Infinity,
    closeButton: true,
    action: { label: 'Usar a minha', onClick: info.onUseMine },
    cancel: { label: 'Manter a dela', onClick: () => undefined },
  });
}