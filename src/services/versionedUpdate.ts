import { supabase } from '../lib/supabaseClient';

interface VersionedRow {
  id: string;
  version: number;
}

type VersionedTable = 'lists' | 'list_items' | 'tasks' | 'notes';

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
  table: VersionedTable,
  base: T,
  changes: Partial<T>,
  options: UpdateOptions<T> = {},
): Promise<UpdateOutcome<T>> {
  let reference: T = base;

  // O client do Supabase aqui não tem tipos gerados do banco, então ele não
  // consegue validar um objeto genérico. O conteúdo é conferido pelos tipos
  // de quem chama esta função (ItemChanges, TaskChanges...) e pelo banco.
  const payload = changes as never;

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
    // Só altera se a versão no banco ainda for a que conhecemos.
    const { data, error } = await supabase
      .from(table)
      .update(payload)
      .eq('id', base.id)
      .eq('version', reference.version)
      .select();
    if (error) throw error;

    const updated = data as T[] | null;
    if (updated && updated.length > 0) {
      return { status: 'ok', row: updated[0] };
    }

    // Nenhuma linha alterada: a versão mudou, o registro sumiu ou o banco recusou.
    const { data: current, error: fetchError } = await supabase
      .from(table)
      .select('*')
      .eq('id', base.id)
      .maybeSingle();
    if (fetchError) throw fetchError;
    if (!current || isSoftDeleted(current)) return { status: 'gone' };

    const server = current as T;

    // O registro existe e a versão é a mesma, mas nada foi alterado:
    // o banco (RLS) recusou por falta de permissão. Não é conflito.
    if (server.version === reference.version) {
      throw Object.assign(new Error('forbidden'), { code: '42501' });
    }

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