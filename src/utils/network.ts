// Interrompe a ação (com erro) quando o navegador está sem internet.
// O texto amigável sai de friendlyError().
export function assertOnline(): void {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    throw new Error('offline');
  }
}