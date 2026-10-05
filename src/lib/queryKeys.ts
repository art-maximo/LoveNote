// Chaves do cache. A Fase 5 (Realtime) usa as mesmas chaves.
export const queryKeys = {
  lists: (workspaceId: string) => ['lists', workspaceId] as const,
  listItems: (workspaceId: string) => ['list_items', workspaceId] as const,
};