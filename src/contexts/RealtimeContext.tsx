import { useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '../lib/supabaseClient';
import { queryKeys } from '../lib/queryKeys';
import { applyServerRow, removeFromCache } from '../lib/cacheSync';
import { useAuth } from '../hooks/useAuth';
import { useWorkspaceId } from '../hooks/useWorkspaceId';
import type { List, ListItem } from '../types';
import { RealtimeContext } from './realtime-context';
import type { ConnectionStatus, RealtimeContextValue } from './realtime-context';

const SYNCED_MESSAGE_MS = 3000;

export function RealtimeProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const workspaceId = useWorkspaceId();
  const userId = user?.id ?? null;

  const [status, setStatus] = useState<ConnectionStatus>('connecting');
  const [partnerOnline, setPartnerOnline] = useState(false);
  // Mudar este número recria o canal (usado ao voltar a internet).
  const [attempt, setAttempt] = useState(0);

  const connectedRef = useRef(false);
  const everConnectedRef = useRef(false);
  const syncedTimerRef = useRef<number | null>(null);

  // Canal do workspace: dados (INSERT/UPDATE/DELETE) + presença.
  useEffect(() => {
    if (!userId) return;

    let disposed = false;
    const listsKey = queryKeys.lists(workspaceId);
    const itemsKey = queryKeys.listItems(workspaceId);
    const filter = `workspace_id=eq.${workspaceId}`;

    function upsertItem(row: ListItem): void {
      applyServerRow(queryClient, itemsKey, row);
    }

    const channel: RealtimeChannel = supabase
      .channel(`workspace:${workspaceId}`, { config: { presence: { key: userId } } })
      // Listas
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'lists', filter },
        (payload) => {
          if (payload.eventType === 'DELETE') {
            const id = (payload.old as { id?: string }).id;
            if (id) removeFromCache(queryClient, listsKey, id);
            return;
          }
          const row = payload.new as List;
          if (row.deleted_at) {
            // Lista excluída (exclusão suave) por qualquer um dos dois
            removeFromCache(queryClient, listsKey, row.id);
          } else {
            applyServerRow(queryClient, listsKey, row);
          }
        },
      )
      // Itens: criar e alterar
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'list_items', filter },
        (payload) => {
          upsertItem(payload.new as ListItem);
        },
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'list_items', filter },
        (payload) => {
          upsertItem(payload.new as ListItem);
        },
      )
      // Itens: apagar. O Realtime não permite filtrar eventos de DELETE;
      // como removemos só pelo id, não há problema.
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'list_items' },
        (payload) => {
          const id = (payload.old as { id?: string }).id;
          if (id) removeFromCache(queryClient, itemsKey, id);
        },
      )
      // Presença: quem está online agora
      .on('presence', { event: 'sync' }, () => {
        const online = Object.keys(channel.presenceState());
        setPartnerOnline(online.some((key) => key !== userId));
      })
      .subscribe((subscribeStatus, err) => {
        if (disposed) return;
        const state: string = subscribeStatus;

        if (state === 'SUBSCRIBED') {
          connectedRef.current = true;
          void channel.track({ user_id: userId });

          // Eventos perdidos antes da inscrição ou durante uma queda não são
          // reenviados: buscamos tudo de novo para garantir dados em dia.
          void queryClient.invalidateQueries({ queryKey: listsKey });
          void queryClient.invalidateQueries({ queryKey: itemsKey });

          if (everConnectedRef.current) {
            setStatus('synced');
            if (syncedTimerRef.current !== null) {
              window.clearTimeout(syncedTimerRef.current);
            }
            syncedTimerRef.current = window.setTimeout(() => {
              setStatus((current) => (current === 'synced' ? 'connected' : current));
            }, SYNCED_MESSAGE_MS);
          } else {
            setStatus('connected');
          }
          everConnectedRef.current = true;
          return;
        }

        // CHANNEL_ERROR, TIMED_OUT ou CLOSED: a biblioteca tenta reconectar sozinha.
        connectedRef.current = false;
        setPartnerOnline(false);
        setStatus(navigator.onLine ? 'reconnecting' : 'offline');
        if (import.meta.env.DEV && err) {
          console.warn('[realtime]', state, err);
        }
      });

    return () => {
      disposed = true;
      if (syncedTimerRef.current !== null) {
        window.clearTimeout(syncedTimerRef.current);
        syncedTimerRef.current = null;
      }
      void supabase.removeChannel(channel);
    };
  }, [queryClient, workspaceId, userId, attempt]);

  // Internet caiu / voltou e app voltou ao primeiro plano (celular).
  useEffect(() => {
    function handleOffline(): void {
      connectedRef.current = false;
      setPartnerOnline(false);
      setStatus('offline');
    }

    function handleOnline(): void {
      setStatus('reconnecting');
      setAttempt((value) => value + 1);
    }

    function handleVisibility(): void {
      if (document.visibilityState !== 'visible') return;
      if (!connectedRef.current && navigator.onLine) {
        setStatus('reconnecting');
        setAttempt((value) => value + 1);
      }
    }

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  const value = useMemo<RealtimeContextValue>(
    () => ({ status, partnerOnline }),
    [status, partnerOnline],
  );

  return <RealtimeContext.Provider value={value}>{children}</RealtimeContext.Provider>;
}