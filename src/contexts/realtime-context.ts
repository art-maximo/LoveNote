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
  // O que a outra pessoa está vendo agora (ex.: "note:<id>"), ou null.
  partnerViewing: string | null;
  // Informa à outra pessoa o que eu estou vendo (null = nada específico).
  setViewing: (key: string | null) => void;
}

export const RealtimeContext = createContext<RealtimeContextValue | null>(null);