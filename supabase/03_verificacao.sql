-- Passo 0: descubra os IDs (rode sozinho e copie os valores)
select u.id as user_id, u.email, wm.workspace_id
  from auth.users u
  left join public.workspace_members wm on wm.user_id = u.id;


-- =====================================================================
-- TESTE A — como membro do casal: deve funcionar
-- Troque <ID_DO_ARTUR> pelo user_id dele.
-- Esperado: 1 lista "Teste RLS", created_by = Artur e 1 atividade list_created.
-- =====================================================================
begin;
set local role authenticated;
select set_config('request.jwt.claims',
  json_build_object('sub', '<ID_DO_ARTUR>', 'role', 'authenticated')::text, true);

insert into public.lists (workspace_id, title)
select workspace_id, 'Teste RLS'
  from public.workspace_members
 where user_id = '<ID_DO_ARTUR>';

select title, created_by, version from public.lists;
select action, entity_title, actor_id from public.activities;
rollback;


-- =====================================================================
-- TESTE B — como um estranho (usuário que não é do casal)
-- Troque <ID_DO_WORKSPACE> pelo workspace_id do passo 0.
-- Esperado: contagens = 0 e o INSERT falha com
-- "new row violates row-level security policy".
-- =====================================================================
begin;
set local role authenticated;
select set_config('request.jwt.claims',
  json_build_object('sub', '00000000-0000-0000-0000-000000000001', 'role', 'authenticated')::text, true);

select count(*) as listas_visiveis    from public.lists;
select count(*) as membros_visiveis   from public.workspace_members;
select count(*) as atividades_visiveis from public.activities;

insert into public.lists (workspace_id, title) values ('<ID_DO_WORKSPACE>', 'invasão');
rollback;


-- =====================================================================
-- TESTE C — cliente não pode criar membro nem forjar atividade
-- Esperado: ambos falham com "permission denied".
-- =====================================================================
begin;
set local role authenticated;
select set_config('request.jwt.claims',
  json_build_object('sub', '<ID_DO_ARTUR>', 'role', 'authenticated')::text, true);

insert into public.workspace_members (workspace_id, user_id)
values ('<ID_DO_WORKSPACE>', '00000000-0000-0000-0000-000000000001');
rollback;

begin;
set local role authenticated;
select set_config('request.jwt.claims',
  json_build_object('sub', '<ID_DO_ARTUR>', 'role', 'authenticated')::text, true);

insert into public.activities (workspace_id, action, entity_type)
values ('<ID_DO_WORKSPACE>', 'fake', 'list');
rollback;