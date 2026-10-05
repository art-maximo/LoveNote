// Funções puras para editar listas guardadas no cache.

export function upsertById<T extends { id: string }>(list: T[] | undefined, row: T): T[] {
  const current = list ?? [];
  const exists = current.some((entry) => entry.id === row.id);
  return exists
    ? current.map((entry) => (entry.id === row.id ? row : entry))
    : [...current, row];
}

export function removeById<T extends { id: string }>(list: T[] | undefined, id: string): T[] {
  return (list ?? []).filter((entry) => entry.id !== id);
}

// NoInfer: o tipo T vem só da lista, nunca do objeto "changes".
export function patchById<T extends { id: string }>(
  list: T[] | undefined,
  id: string,
  changes: Partial<NoInfer<T>>,
): T[] {
  return (list ?? []).map((entry) => (entry.id === id ? { ...entry, ...changes } : entry));
}