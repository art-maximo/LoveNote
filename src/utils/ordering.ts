// Calcula a posição de um item solto entre dois vizinhos.
// A coluna "position" é um número decimal: basta um valor entre os vizinhos,
// sem precisar renumerar a lista inteira.
export function positionBetween(
  before: number | undefined,
  after: number | undefined,
): number {
  if (before === undefined && after === undefined) return Date.now() / 1000;
  if (before === undefined) return (after as number) - 1;
  if (after === undefined) return before + 1;
  return (before + after) / 2;
}