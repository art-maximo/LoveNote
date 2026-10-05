import { useAuth } from './useAuth';

// Só deve ser usado dentro de páginas protegidas, onde o workspace já foi carregado.
export function useWorkspaceId(): string {
  const { workspaceId } = useAuth();
  if (!workspaceId) {
    throw new Error('Workspace não carregado.');
  }
  return workspaceId;
}