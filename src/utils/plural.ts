// plural(3, 'tarefa', 'tarefas') -> "3 tarefas"; plural(1, ...) -> "1 tarefa"
export function plural(count: number, one: string, many: string): string {
  return `${count} ${count === 1 ? one : many}`;
}