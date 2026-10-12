import type { Plan } from '../../types';

// Valor especial: "apague esta chave dos dados".
export const REMOVE_KEY = Symbol('remove-key');

// Alterações em chaves dos dados (cada chave é independente).
export type DataPatch = Record<string, unknown>;

// O que uma edição quer mudar no planejamento.
export interface PlanPatch {
  title?: string;
  data?: DataPatch;
  starts_on?: string | null;
}

// Aplica as alterações sobre os dados, chave por chave.
export function mergeData(
  base: Record<string, unknown>,
  patch: DataPatch,
): Record<string, unknown> {
  const next: Record<string, unknown> = { ...base };
  for (const [key, value] of Object.entries(patch)) {
    if (value === REMOVE_KEY) {
      delete next[key];
    } else {
      next[key] = value;
    }
  }
  return next;
}

// Aplica uma alteração a um planejamento (usado na atualização otimista).
export function applyPlanPatch(plan: Plan, patch: PlanPatch): Plan {
  return {
    ...plan,
    title: patch.title ?? plan.title,
    data: patch.data ? mergeData(plan.data, patch.data) : plan.data,
    starts_on: patch.starts_on !== undefined ? patch.starts_on : plan.starts_on,
  };
}

// Representação estável (ordena as chaves) para comparar valores JSON.
function canonical(value: unknown): string {
  if (value === undefined) return 'undefined';
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  if (value !== null && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    const parts = Object.keys(record)
      .filter((key) => record[key] !== undefined)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${canonical(record[key])}`);
    return `{${parts.join(',')}}`;
  }
  return JSON.stringify(value);
}

export function sameValue(a: unknown, b: unknown): boolean {
  return canonical(a) === canonical(b);
}