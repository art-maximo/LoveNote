import type { QueryClient, QueryKey } from '@tanstack/react-query';
import { removeById, upsertById } from '../utils/cache';
import { isBusy } from './rowQueue';

interface VersionedRow {
  id: string;
  version: number;
}

// Aplica no cache uma linha vinda do servidor (resposta ou evento Realtime).
// Ignora quando:
//  - há alterações locais desse registro em andamento;
//  - o cache já tem uma versão mais nova (evento atrasado);
//  - o cache ainda não foi carregado (a busca inicial traz tudo).
export function applyServerRow<T extends VersionedRow>(
  queryClient: QueryClient,
  key: QueryKey,
  row: T,
): void {
  if (isBusy(row.id)) return;

  queryClient.setQueryData<T[]>(key, (old) => {
    if (old === undefined) return old;
    const existing = old.find((entry) => entry.id === row.id);
    if (existing && existing.version > row.version) return old;
    return upsertById(old, row);
  });
}

export function removeFromCache(queryClient: QueryClient, key: QueryKey, id: string): void {
  queryClient.setQueryData<Array<{ id: string }>>(key, (old) =>
    old === undefined ? old : removeById(old, id),
  );
}