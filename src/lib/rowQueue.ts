// Fila por registro: as alterações de um mesmo item são enviadas
// uma de cada vez, na ordem em que a pessoa as fez.

const chains = new Map<string, Promise<void>>();
const counts = new Map<string, number>();

// true enquanto houver alterações locais deste registro em andamento.
// Durante esse tempo, eventos do Realtime sobre ele são ignorados
// (a resposta final do servidor já traz tudo atualizado).
export function isBusy(id: string): boolean {
  return (counts.get(id) ?? 0) > 0;
}

function release(id: string): void {
  const remaining = (counts.get(id) ?? 1) - 1;
  if (remaining <= 0) {
    counts.delete(id);
  } else {
    counts.set(id, remaining);
  }
}

export function runSerial<T>(id: string, task: () => Promise<T>): Promise<T> {
  counts.set(id, (counts.get(id) ?? 0) + 1);

  const previous = chains.get(id) ?? Promise.resolve();
  const result = previous.then(task).finally(() => release(id));

  // "tail" nunca rejeita: um erro numa alteração não trava as seguintes.
  const tail = result.then(
    () => undefined,
    () => undefined,
  );
  chains.set(id, tail);
  void tail.then(() => {
    if (chains.get(id) === tail) chains.delete(id);
  });

  return result;
}