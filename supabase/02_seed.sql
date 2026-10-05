-- =====================================================================
-- LoveNote — cria o workspace do casal e vincula as duas contas.
-- Pode ser executado de novo sem duplicar nada.
-- =====================================================================
do $do$
declare
  -- EDITE AQUI: usuário (minúsculas, sem espaço) e nome de exibição
  v_user1  text := 'artur';
  v_name1  text := 'Artur';
  v_user2  text := 'ana';
  v_name2  text := 'Ana';
  v_domain text := '@lovenote.app';

  v_id1 uuid;
  v_id2 uuid;
  v_ws  uuid;
begin
  select id into v_id1 from auth.users where lower(email) = v_user1 || v_domain;
  select id into v_id2 from auth.users where lower(email) = v_user2 || v_domain;

  if v_id1 is null or v_id2 is null then
    raise exception
      'Conta não encontrada. Crie % e % em Authentication > Users antes de rodar este script.',
      v_user1 || v_domain, v_user2 || v_domain;
  end if;

  -- profiles (o trigger já cria; aqui ajustamos o nome de exibição)
  insert into public.profiles (id, username, display_name)
  values (v_id1, v_user1, v_name1), (v_id2, v_user2, v_name2)
  on conflict (id) do update
    set username = excluded.username,
        display_name = excluded.display_name;

  -- workspace (reaproveita se o usuário 1 já tiver um)
  select workspace_id into v_ws from public.workspace_members where user_id = v_id1;

  if v_ws is null then
    insert into public.workspaces (name, created_by)
    values ('Nosso espaço', v_id1)
    returning id into v_ws;
  end if;

  -- membros (só insere quem ainda não é membro)
  insert into public.workspace_members (workspace_id, user_id, role)
  select v_ws, v_id1, 'owner'
   where not exists (select 1 from public.workspace_members where user_id = v_id1);

  insert into public.workspace_members (workspace_id, user_id, role)
  select v_ws, v_id2, 'member'
   where not exists (select 1 from public.workspace_members where user_id = v_id2);

  raise notice 'Workspace % pronto com % e %.', v_ws, v_name1, v_name2;
end $do$;