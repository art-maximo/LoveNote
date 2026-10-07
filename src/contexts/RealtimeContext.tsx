import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '../lib/supabaseClient';
import { queryKeys } from '../lib/queryKeys';
import { applyServerRow, removeFromCache } from '../lib/cacheSync';
import { useAuth } from '../hooks/useAuth';
import { useWorkspaceId } from '../hooks/useWorkspaceId';
import type { List, ListItem, Note, Task } from '../types';
import { RealtimeContext } from './realtime-context';
import type { ConnectionStatus, RealtimeContextValue } from './realtime-context';

const SYNCED_MESSAGE_MS = 3000;

type PresenceMeta = { user_id: string; viewing: string | null };

export function RealtimeProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const workspaceId = useWorkspaceId();
  const userId = user?.id ?? null;

  const [status, setStatus] = useState<ConnectionStatus>('connecting');
  const [partnerOnline, setPartnerOnline] = useState(false);
  const [partnerViewing, setPartnerViewing] = useState<string | null>(null);
  // Mudar este número recria o canal (usado ao voltar a internet).
  const [attempt, setAttempt] = useState(0);

  const connectedRef = useRef(false);
  const everConnectedRef = useRef(false);
  const syncedTimerRef = useRef<number | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const userIdRef = useRef<string | null>(null);
  const viewingRef = useRef<string | null>(null);

  // Canal do workspace: dados (INSERT/UPDATE/DELETE) + presença.
  useEffect(() => {
    if (!userId) return;

    let disposed = false;
    userIdRef.current = userId;
    const listsKey = queryKeys.lists(workspaceId);
    const itemsKey = queryKeys.listItems(workspaceId);
    const tasksKey = queryKeys.tasks(workspaceId);
    const notesKey = queryKeys.notes(workspaceId);
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
      // Tarefas (exclusão suave: chega como UPDATE com deleted_at preenchido)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tasks', filter },
        (payload) => {
          if (payload.eventType === 'DELETE') {
            const id = (payload.old as { id?: string }).id;
            if (id) removeFromCache(queryClient, tasksKey, id);
            return;
          }
          const row = payload.new as Task;
          if (row.deleted_at) {
            removeFromCache(queryClient, tasksKey, row.id);
          } else {
            applyServerRow(queryClient, tasksKey, row);
          }
        },
      )
      // Anotações (exclusão suave, como as tarefas)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notes', filter },
        (payload) => {
          if (payload.eventType === 'DELETE') {
            const id = (payload.old as { id?: string }).id;
            if (id) removeFromCache(queryClient, notesKey, id);
            return;
          }
          const row = payload.new as Note;
          if (row.deleted_at) {
            removeFromCache(queryClient, notesKey, row.id);
          } else {
            applyServerRow(queryClient, notesKey, row);
          }
        },
      )
      // Presença: quem está online e o que está vendo
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState<PresenceMeta>();
        let online = false;
        let viewing: string | null = null;
        for (const [presenceKey, metas] of Object.entries(state)) {
          if (presenceKey === userId) continue;
          online = true;
          const latest = metas[metas.length - 1];
          viewing = latest ? latest.viewing : null;
        }
        setPartnerOnline(online);
        setPartnerViewing(online ? viewing : null);
      })
      .subscribe((subscribeStatus, err) => {
        if (disposed) return;
        const state: string = subscribeStatus;

        if (state === 'SUBSCRIBED') {
          connectedRef.current = true;
          void channel.track({ user_id: userId, viewing: viewingRef.current });

          // Eventos perdidos antes da inscrição ou durante uma queda não são
          // reenviados: buscamos tudo de novo para garantir dados em dia.
          void queryClient.invalidateQueries({ queryKey: listsKey });
          void queryClient.invalidateQueries({ queryKey: itemsKey });
          void queryClient.invalidateQueries({ queryKey: tasksKey });
          void queryClient.invalidateQueries({ queryKey: notesKey });

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
        setPartnerViewing(null);
        setStatus(navigator.onLine ? 'reconnecting' : 'offline');
        if (import.meta.env.DEV && err) {
          console.warn('[realtime]', state, err);
        }
      });

    channelRef.current = channel;

    return () => {
      disposed = true;
      channelRef.current = null;
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
      setPartnerViewing(null);
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

  // Informa à outra pessoa o que estou vendo (ex.: "note:<id>").
  const setViewing = useCallback((key: string | null) => {
    viewingRef.current = key;
    const channel = channelRef.current;
    const currentUser = userIdRef.current;
    if (channel && connectedRef.current && currentUser) {
      void channel.track({ user_id: currentUser, viewing: key });
    }
  }, []);

  const value = useMemo<RealtimeContextValue>(
    () => ({ status, partnerOnline, partnerViewing, setViewing }),
    [status, partnerOnline, partnerViewing, setViewing],
  );

  return <RealtimeContext.Provider value={value}>{children}</RealtimeContext.Provider>;
}