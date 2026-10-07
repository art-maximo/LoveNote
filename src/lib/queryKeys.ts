// Chaves do cache. O Realtime usa as mesmas chaves.
export const queryKeys = {
  lists: (workspaceId: string) => ['lists', workspaceId] as const,
  listItems: (workspaceId: string) => ['list_items', workspaceId] as const,
  tasks: (workspaceId: string) => ['tasks', workspaceId] as const,
  notes: (workspaceId: string) => ['notes', workspaceId] as const,
};