import type { QueryClient, QueryKey } from '@tanstack/react-query';
import type { Activity } from '../types/activity';
import { upsertById } from '../utils/cache';

const MAX_CACHED = 50;

// Aplica no cache uma atividade vinda do Realtime, mantendo a lista da mais
// nova para a mais antiga. (O banco reaproveita a mesma linha quando a mesma
// pessoa edita a mesma anotação várias vezes em 10 minutos; por isso também
// tratamos UPDATE.) Ignora se o cache ainda não foi carregado.
export function applyActivityRow(queryClient: QueryClient, key: QueryKey, row: Activity): void {
  queryClient.setQueryData<Activity[]>(key, (old) => {
    if (old === undefined) return old;
    return upsertById(old, row)
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
      .slice(0, MAX_CACHED);
  });
}