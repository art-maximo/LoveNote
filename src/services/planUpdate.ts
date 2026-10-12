import { supabase } from '../lib/supabaseClient';
import { REMOVE_KEY, mergeData, sameValue } from '../lib/plans/patch';
import type { PlanPatch } from '../lib/plans/patch';
import type { Plan } from '../types';

export type PlanUpdateOutcome =
  | { status: 'ok'; row: Plan }
  | { status: 'gone' }
  // key: "title" ou "data.<chave>"
  | { status: 'conflict'; server: Plan; key: string };

interface UpdateOptions {
  // Ignora conflitos e grava a minha versão.
  force?: boolean;
}

const MAX_ATTEMPTS = 4;

// Atualização de um planejamento com controle de versão, chave por chave.
// `base` é o planejamento como a pessoa o viu quando começou a editar.
// Se outra pessoa salvou antes, a alteração é reaplicada sobre a versão mais
// nova, a não ser que as duas tenham mexido na MESMA chave de formas diferentes.
export async function updatePlanVersioned(
  base: Plan,
  patch: PlanPatch,
  options: UpdateOptions = {},
): Promise<PlanUpdateOutcome> {
  let reference: Plan = base;

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
    const payload: Record<string, unknown> = {};
    if (patch.title !== undefined) payload.title = patch.title;
    if (patch.starts_on !== undefined) payload.starts_on = patch.starts_on;
    // Sempre calculado sobre a versão de referência (a mais nova que conhecemos)
    if (patch.data) payload.data = mergeData(reference.data, patch.data);

    // Só altera se a versão no banco ainda for a que conhecemos.
    const { data, error } = await supabase
      .from('plans')
      .update(payload as never)
      .eq('id', base.id)
      .eq('version', reference.version)
      .select();
    if (error) throw error;

    const updated = data as Plan[] | null;
    if (updated && updated.length > 0) {
      return { status: 'ok', row: updated[0] };
    }

    // Nenhuma linha alterada: a versão mudou, o registro sumiu ou o banco recusou.
    const { data: current, error: fetchError } = await supabase
      .from('plans')
      .select('*')
      .eq('id', base.id)
      .maybeSingle();
    if (fetchError) throw fetchError;

    const server = current as Plan | null;
    if (!server || server.deleted_at) return { status: 'gone' };

    // Mesma versão, nada alterado: o banco recusou por falta de permissão.
    if (server.version === reference.version) {
      throw Object.assign(new Error('forbidden'), { code: '42501' });
    }

    if (!options.force) {
      if (
        patch.title !== undefined &&
        server.title !== reference.title &&
        server.title !== patch.title
      ) {
        return { status: 'conflict', server, key: 'title' };
      }

      if (patch.data) {
        for (const [key, value] of Object.entries(patch.data)) {
          const mine = value === REMOVE_KEY ? undefined : value;
          const changedByOther = !sameValue(server.data[key], reference.data[key]);
          const sameAsMine = sameValue(server.data[key], mine);
          if (changedByOther && !sameAsMine) {
            return { status: 'conflict', server, key: `data.${key}` };
          }
        }
      }
    }

    // Sem conflito real: reaplica as minhas mudanças sobre a versão mais nova.
    reference = server;
  }

  throw new Error('conflict_retry_limit');
}