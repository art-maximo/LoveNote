// O Supabase Auth exige e-mail; usamos um e-mail interno fictício
// derivado do nome de usuário (nenhum e-mail é enviado).
export const EMAIL_DOMAIN = 'lovenote.app';

const USERNAME_PATTERN = /^[a-z0-9_]{2,20}$/;

export function normalizeUsername(raw: string): string {
  return raw.trim().toLowerCase();
}

export function isValidUsername(username: string): boolean {
  return USERNAME_PATTERN.test(username);
}

export function usernameToEmail(username: string): string {
  return `${normalizeUsername(username)}@${EMAIL_DOMAIN}`;
}