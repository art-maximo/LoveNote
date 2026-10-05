import { createClient } from '@supabase/supabase-js';

const url: unknown = import.meta.env.VITE_SUPABASE_URL;
const anonKey: unknown = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (typeof url !== 'string' || url === '' || typeof anonKey !== 'string' || anonKey === '') {
  throw new Error(
    'Variáveis VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY não configuradas. ' +
      'Crie o arquivo .env.local (veja .env.example) e reinicie o npm run dev.',
  );
}

// Único ponto de criação do client. A sessão fica salva no navegador
// e o token é renovado automaticamente.
export const supabase = createClient(url, anonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
});