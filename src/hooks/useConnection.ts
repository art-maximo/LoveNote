import { useContext } from 'react';
import { RealtimeContext } from '../contexts/realtime-context';
import type { RealtimeContextValue } from '../contexts/realtime-context';

export function useConnection(): RealtimeContextValue {
  const context = useContext(RealtimeContext);
  if (!context) {
    throw new Error('useConnection deve ser usado dentro de <RealtimeProvider>');
  }
  return context;
}