import { useEffect } from 'react';
import { useConnection } from './useConnection';

// Avisa a outra pessoa o que você está vendo (ex.: "note:<id>") enquanto
// o componente estiver na tela.
export function useViewing(key: string | null): void {
  const { setViewing } = useConnection();

  useEffect(() => {
    setViewing(key);
    return () => setViewing(null);
  }, [key, setViewing]);
}