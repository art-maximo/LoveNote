import { supabase } from '../lib/supabaseClient';

interface VersionedRow {
  id: string;
  version: number;
}

export type UpdateOutcome<T> =
  | { status: 'ok'; row: T }
  | { status: 'gone' }
  | { status: 'conflict'; server: T; field: string };

interface UpdateOptions<T> {
  // Ignora conflitos e grava a minha versão.
  force?: boolean;
  // Campos em que "a última gravação vence" (ex.: position).
  softFields?: ReadonlyArray<keyof T>;
}

const MAX_ATTEMPTS = 4;

function isSoftDeleted(row: unknown): boolean {
  if (typeof row !== 'object' || row === null || !('deleted_at' in row)) return false;
  const value = (row as Record<string, unknown>).deleted_at;
  return value !== null && value !== undefined;
}

// Atualização com controle de versão (concorrência otimista).
// `base` é o registro como a pessoa o viu quando começou a editar.
export async function updateVersioned<T extends VersionedRow>(
  table: 'lists' | 'list_items',
  base: T,
  changes: Partial<T>,
  options: UpdateOptions<T> = {},
): Promise<UpdateOutcome<T>> {
  let reference: T = base;

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
    // Só altera se a versão no banco ainda for a que conhecemos.
    const { data, error } = await supabase
      .from(table)
      .update(changes as never)
      .eq('id', base.id)
      .eq('version', reference.version)
      .select();
    if (error) throw error;

    const updated = data as T[] | null;
    if (updated && updated.length > 0) {
      return { status: 'ok', row: updated[0] };
    }

    // Nenhuma linha alterada: a versão mudou ou o registro sumiu.
    const { data: current, error: fetchError } = await supabase
      .from(table)
      .select('*')
      .eq('id', base.id)
      .maybeSingle();
    if (fetchError) throw fetchError;
    if (!current || isSoftDeleted(current)) return { status: 'gone' };

    const server = current as T;

    if (!options.force) {
      const soft = options.softFields ?? [];
      const keys = Object.keys(changes) as Array<keyof T & string>;
      for (const key of keys) {
        if (soft.includes(key)) continue;
        const changedByOther = server[key] !== reference[key];
        const sameAsMine = server[key] === changes[key];
        if (changedByOther && !sameAsMine) {
          return { status: 'conflict', server, field: key };
        }
      }
    }

    // Sem conflito real: reaplica as minhas mudanças sobre a versão mais nova.
    reference = server;
  }

  throw new Error('conflict_retry_limit');
}