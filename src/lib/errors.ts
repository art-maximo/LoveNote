// Mensagem interna usada para sinalizar timeout (ver utils/async.ts)
export const TIMEOUT_MESSAGE = 'request_timeout';

function readProp(value: unknown, key: string): unknown {
  if (typeof value === 'object' && value !== null && key in value) {
    return (value as Record<string, unknown>)[key];
  }
  return undefined;
}

// Converte qualquer erro técnico em uma mensagem amigável em português.
export function friendlyError(
  error: unknown,
  fallback = 'Algo deu errado. Tente novamente.',
): string {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return 'Você está sem conexão com a internet.';
  }

  const message = readProp(error, 'message');
  const code = readProp(error, 'code');
  const name = readProp(error, 'name');

  if (message === TIMEOUT_MESSAGE) {
    return 'A conexão demorou demais. Tente novamente.';
  }

  if (
    name === 'AuthRetryableFetchError' ||
    (typeof message === 'string' && message.includes('Failed to fetch'))
  ) {
    return 'Não foi possível conectar ao servidor. Verifique sua internet.';
  }

  if (typeof message === 'string' && message.includes('Invalid API key')) {
    return 'A chave do Supabase no arquivo .env.local está incorreta.';
  }

  switch (code) {
    case 'invalid_credentials':
      return 'Usuário ou senha incorretos.';
    case 'email_not_confirmed':
      return 'Esta conta ainda não foi confirmada no Supabase (Authentication > Users).';
    case 'email_provider_disabled':
      return 'O login por e-mail está desativado no Supabase.';
    case 'user_banned':
      return 'Esta conta está bloqueada.';
    case 'over_request_rate_limit':
      return 'Muitas tentativas seguidas. Aguarde um minuto e tente de novo.';
    case 'session_expired':
    case 'session_not_found':
    case 'refresh_token_not_found':
    case 'refresh_token_already_used':
    case 'bad_jwt':
      return 'Sua sessão expirou. Entre novamente.';
    case '42501':
      return 'Você não tem permissão para fazer isso.';
    case 'PGRST116':
      return 'Esse item não existe mais.';
    default:
      if (import.meta.env.DEV) {
        console.error('[friendlyError] erro não mapeado:', error);
      }
      return fallback;
  }
}