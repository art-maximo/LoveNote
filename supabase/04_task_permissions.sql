-- =====================================================================
-- LoveNote — permissões de edição das tarefas
-- Execute UMA vez no SQL Editor do Supabase.
-- =====================================================================

-- 1. Coluna de permissão.
-- As tarefas que já existem ficam liberadas para os dois (default true só
-- vale para as linhas atuais); as novas passam a nascer bloqueadas.
alter table public.tasks
  add column allow_partner_edit boolean not null default true;

alter table public.tasks
  alter column allow_partner_edit set default false;


-- 2. UPDATE (inclui a exclusão suave): criador, ou permissão ligada,
-- ou responsável (neste caso o trigger abaixo limita o que pode mudar).
drop policy if exists "tasks_update" on public.tasks;

create policy "tasks_update" on public.tasks
  for update to authenticated
  using (
    public.is_workspace_member(workspace_id)
    and (
      created_by is null
      or created_by = (select auth.uid())
      or allow_partner_edit
      or assignee_id = (select auth.uid())
    )
  )
  with check (public.is_workspace_member(workspace_id));


-- 3. Sem exclusão definitiva pelo cliente (o app usa exclusão suave).
drop policy if exists "tasks_delete" on public.tasks;
revoke delete on public.tasks from authenticated;


-- 4. Trigger de proteção: o que o RLS não consegue expressar (colunas).
create or replace function public.trg_tasks_edit_guard()
returns trigger language plpgsql as $$
declare
  v_uid      uuid := auth.uid();
  v_is_owner boolean;
  v_can_edit boolean;
begin
  -- SQL Editor / service role: sem usuário logado, sem restrição.
  if v_uid is null then
    return new;
  end if;

  v_is_owner := old.created_by is null or old.created_by = v_uid;
  v_can_edit := v_is_owner or old.allow_partner_edit;

  if new.created_by is distinct from old.created_by then
    raise exception 'O criador da tarefa não pode ser alterado.'
      using errcode = '42501';
  end if;

  if new.allow_partner_edit is distinct from old.allow_partner_edit and not v_is_owner then
    raise exception 'Só quem criou a tarefa pode alterar essa permissão.'
      using errcode = '42501';
  end if;

  if v_can_edit then
    return new;
  end if;

  -- Sem permissão: a pessoa responsável só pode marcar/desmarcar como concluída.
  -- (completed_at, version e updated_at são ajustados pelo próprio banco.)
  if old.assignee_id = v_uid
     and (new.title, new.description, new.priority, new.due_date, new.assignee_id, new.deleted_at)
         is not distinct from
         (old.title, old.description, old.priority, old.due_date, old.assignee_id, old.deleted_at)
  then
    return new;
  end if;

  raise exception 'Você não tem permissão para editar esta tarefa.'
    using errcode = '42501';
end $$;

drop trigger if exists b_tasks_edit_guard on public.tasks;
create trigger b_tasks_edit_guard before update on public.tasks
  for each row execute function public.trg_tasks_edit_guard();