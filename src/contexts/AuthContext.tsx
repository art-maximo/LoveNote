import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { toast } from 'sonner';
import { supabase } from '../lib/supabaseClient';
import { friendlyError } from '../lib/errors';
import { withTimeout } from '../utils/async';
import { usernameToEmail } from '../utils/auth';
import type { Profile } from '../types';
import { AuthContext } from './auth-context';
import type { AccountState, AuthContextValue, AuthStatus } from './auth-context';

// Carrega o perfil do usuário, o do parceiro e o workspace.
// O RLS garante que só voltam os perfis do próprio casal.
async function loadAccount(userId: string): Promise<AccountState> {
  try {
    const [profilesRes, memberRes] = await withTimeout(
      Promise.all([
        supabase
          .from('profiles')
          .select('id, username, display_name, created_at, updated_at'),
        supabase
          .from('workspace_members')
          .select('workspace_id')
          .eq('user_id', userId)
          .maybeSingle(),
      ]),
    );

    if (profilesRes.error) throw profilesRes.error;
    if (memberRes.error) throw memberRes.error;

    const rows = (profilesRes.data ?? []) as Profile[];
    const member = memberRes.data as { workspace_id: string } | null;
    const profile = rows.find((row) => row.id === userId) ?? null;
    const partner = rows.find((row) => row.id !== userId) ?? null;

    if (!profile || !member) {
      return {
        userId,
        kind: 'no_workspace',
        profile,
        partner,
        workspaceId: null,
        errorMessage: null,
      };
    }

    return {
      userId,
      kind: 'ready',
      profile,
      partner,
      workspaceId: member.workspace_id,
      errorMessage: null,
    };
  } catch (error) {
    return {
      userId,
      kind: 'error',
      profile: null,
      partner: null,
      workspaceId: null,
      errorMessage: friendlyError(error, 'Não foi possível carregar sua conta.'),
    };
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [account, setAccount] = useState<AccountState | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const hadSessionRef = useRef(false);
  const manualSignOutRef = useRef(false);

  // Escuta mudanças de sessão. O callback só atualiza estado
  // (sem chamar o Supabase aqui dentro, para evitar travamentos).
  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((event, newSession) => {
      if (event === 'SIGNED_OUT') {
        if (hadSessionRef.current && !manualSignOutRef.current) {
          toast.info('Sua sessão expirou. Entre novamente.');
        }
        manualSignOutRef.current = false;
      }
      hadSessionRef.current = newSession !== null;
      setSession(newSession);
      setAuthReady(true);
    });

    return () => data.subscription.unsubscribe();
  }, []);

  const userId = session?.user.id ?? null;

  // Quando há usuário logado, carrega perfil + workspace.
  useEffect(() => {
    if (!userId) return;

    let cancelled = false;
    void loadAccount(userId).then((result) => {
      if (!cancelled) setAccount(result);
    });

    return () => {
      cancelled = true;
    };
  }, [userId, reloadKey]);

  const signIn = useCallback(async (username: string, password: string) => {
    if (!navigator.onLine) {
      throw new Error('Você está sem conexão com a internet.');
    }
    try {
      const { error } = await withTimeout(
        supabase.auth.signInWithPassword({
          email: usernameToEmail(username),
          password,
        }),
      );
      if (error) throw error;
    } catch (error) {
      throw new Error(friendlyError(error, 'Não foi possível entrar. Tente novamente.'));
    }
  }, []);

  const signOut = useCallback(async () => {
    manualSignOutRef.current = true;
    // scope "local": encerra a sessão só neste dispositivo
    const { error } = await supabase.auth.signOut({ scope: 'local' });
    if (error) {
      manualSignOutRef.current = false;
      throw new Error(friendlyError(error, 'Não foi possível sair.'));
    }
  }, []);

  const reloadAccount = useCallback(() => {
    setAccount(null);
    setReloadKey((key) => key + 1);
  }, []);

  const value = useMemo<AuthContextValue>(() => {
    const current =
      account && session && account.userId === session.user.id ? account : null;

    let status: AuthStatus;
    if (!authReady) status = 'loading';
    else if (!session) status = 'signed_out';
    else if (!current) status = 'loading_account';
    else status = current.kind;

    return {
      status,
      session,
      user: session?.user ?? null,
      profile: current?.profile ?? null,
      partner: current?.partner ?? null,
      workspaceId: current?.workspaceId ?? null,
      errorMessage: current?.errorMessage ?? null,
      signIn,
      signOut,
      reloadAccount,
    };
  }, [account, session, authReady, signIn, signOut, reloadAccount]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}