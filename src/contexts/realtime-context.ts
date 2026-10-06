import { createContext } from 'react';

export type ConnectionStatus =
  | 'connecting' // abrindo a conexão pela primeira vez
  | 'connected' // 🟢 Conectado
  | 'synced' // 🟢 Sincronizado (aparece por alguns segundos após reconectar)
  | 'reconnecting' // tentando voltar
  | 'offline'; // 🔴 Sem conexão

export interface RealtimeContextValue {
  status: ConnectionStatus;
  partnerOnline: boolean;
}

export const RealtimeContext = createContext<RealtimeContextValue | null>(null);