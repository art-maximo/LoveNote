-- =====================================================================
-- LoveNote — função para o ping automático (mantém o projeto ativo)
-- Execute UMA vez no SQL Editor do Supabase.
-- =====================================================================

create or replace function public.keepalive()
returns timestamptz
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Lê o banco de verdade, mas devolve só a hora: nenhum dado é exposto.
  perform 1 from public.workspaces limit 1;
  return now();
end $$;

revoke execute on function public.keepalive() from public;
grant execute on function public.keepalive() to anon, authenticated;