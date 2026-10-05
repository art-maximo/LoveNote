import { createContext } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import type { Profile } from '../types';

export type AuthStatus =
  | 'loading' // verificando se há sessão salva
  | 'signed_out' // sem sessão
  | 'loading_account' // logado, carregando perfil e workspace
  | 'ready' // tudo pronto
  | 'no_workspace' // conta existe mas não está vinculada a um workspace
  | 'error'; // falha ao carregar a conta

export interface AccountState {
  userId: string;
  kind: 'ready' | 'no_workspace' | 'error';
  profile: Profile | null;
  partner: Profile | null;
  workspaceId: string | null;
  errorMessage: string | null;
}

export interface AuthContextValue {
  status: AuthStatus;
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  partner: Profile | null;
  workspaceId: string | null;
  errorMessage: string | null;
  signIn: (username: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  reloadAccount: () => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);