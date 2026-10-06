-- =====================================================================
-- TESTE 1 — parceiro SEM permissão não consegue editar
-- Esperado: linhas_alteradas = 0
-- =====================================================================
begin;
set local role authenticated;
select set_config('request.jwt.claims',
  json_build_object('sub', '<ID_A>', 'role', 'authenticated')::text, true);

insert into public.tasks (workspace_id, title)
select workspace_id, 'Tarefa de teste'
  from public.workspace_members where user_id = '<ID_A>';

select set_config('request.jwt.claims',
  json_build_object('sub', '<ID_B>', 'role', 'authenticated')::text, true);

with changed as (
  update public.tasks set title = 'invadida'
   where title = 'Tarefa de teste' returning id
)
select count(*) as linhas_alteradas from changed;
rollback;


-- =====================================================================
-- TESTE 2 — criador LIBERA, parceiro passa a poder editar
-- Esperado: linhas_alteradas = 1
-- =====================================================================
begin;
set local role authenticated;
select set_config('request.jwt.claims',
  json_build_object('sub', '<ID_A>', 'role', 'authenticated')::text, true);

insert into public.tasks (workspace_id, title)
select workspace_id, 'Tarefa de teste'
  from public.workspace_members where user_id = '<ID_A>';

update public.tasks set allow_partner_edit = true where title = 'Tarefa de teste';

select set_config('request.jwt.claims',
  json_build_object('sub', '<ID_B>', 'role', 'authenticated')::text, true);

with changed as (
  update public.tasks set title = 'editada pelo parceiro'
   where title = 'Tarefa de teste' returning id
)
select count(*) as linhas_alteradas from changed;
rollback;


-- =====================================================================
-- TESTE 3 — responsável (sem permissão) PODE concluir a tarefa
-- Esperado: linhas_alteradas = 1
-- =====================================================================
begin;
set local role authenticated;
select set_config('request.jwt.claims',
  json_build_object('sub', '<ID_A>', 'role', 'authenticated')::text, true);

insert into public.tasks (workspace_id, title, assignee_id)
select workspace_id, 'Tarefa de teste', '<ID_B>'
  from public.workspace_members where user_id = '<ID_A>';

select set_config('request.jwt.claims',
  json_build_object('sub', '<ID_B>', 'role', 'authenticated')::text, true);

with changed as (
  update public.tasks set is_done = true
   where title = 'Tarefa de teste' returning id
)
select count(*) as linhas_alteradas from changed;
rollback;


-- =====================================================================
-- TESTE 4 — responsável (sem permissão) NÃO pode mudar outro campo
-- Esperado: ERRO "Você não tem permissão para editar esta tarefa."
-- =====================================================================
begin;
set local role authenticated;
select set_config('request.jwt.claims',
  json_build_object('sub', '<ID_A>', 'role', 'authenticated')::text, true);

insert into public.tasks (workspace_id, title, assignee_id)
select workspace_id, 'Tarefa de teste', '<ID_B>'
  from public.workspace_members where user_id = '<ID_A>';

select set_config('request.jwt.claims',
  json_build_object('sub', '<ID_B>', 'role', 'authenticated')::text, true);

update public.tasks set title = 'invadida' where title = 'Tarefa de teste';
rollback;


-- =====================================================================
-- TESTE 5 — parceiro COM permissão não pode mexer na própria permissão
-- Esperado: ERRO "Só quem criou a tarefa pode alterar essa permissão."
-- =====================================================================
begin;
set local role authenticated;
select set_config('request.jwt.claims',
  json_build_object('sub', '<ID_A>', 'role', 'authenticated')::text, true);

insert into public.tasks (workspace_id, title, allow_partner_edit)
select workspace_id, 'Tarefa de teste', true
  from public.workspace_members where user_id = '<ID_A>';

select set_config('request.jwt.claims',
  json_build_object('sub', '<ID_B>', 'role', 'authenticated')::text, true);

update public.tasks set allow_partner_edit = false where title = 'Tarefa de teste';
rollback;


-- =====================================================================
-- TESTE 6 — exclusão definitiva é negada para todos
-- Esperado: ERRO "permission denied for table tasks"
-- =====================================================================
begin;
set local role authenticated;
select set_config('request.jwt.claims',
  json_build_object('sub', '<ID_A>', 'role', 'authenticated')::text, true);

insert into public.tasks (workspace_id, title)
select workspace_id, 'Tarefa de teste'
  from public.workspace_members where user_id = '<ID_A>';

delete from public.tasks where title = 'Tarefa de teste';
rollback;