-- =====================================================================
-- LoveNote — Fase 2: schema, RLS, triggers e Realtime
-- Execute UMA vez no SQL Editor do Supabase (projeto novo, vazio).
-- =====================================================================


-- =====================================================================
-- 1. FUNÇÕES UTILITÁRIAS DE TRIGGER
-- =====================================================================

-- Atualiza updated_at (tabelas sem controle de versão)
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

-- Controle de versão otimista: o servidor é quem incrementa a versão,
-- ignorando qualquer valor enviado pelo cliente. Também impede mover
-- um registro para outro workspace.
create or replace function public.bump_version()
returns trigger language plpgsql as $$
begin
  if new.workspace_id is distinct from old.workspace_id then
    raise exception 'workspace_id não pode ser alterado';
  end if;
  new.version    := old.version + 1;
  new.updated_at := now();
  return new;
end $$;

-- Autoria carimbada pelo servidor (o cliente não consegue forjar)
create or replace function public.set_created_by()
returns trigger language plpgsql as $$
begin
  if auth.uid() is not null then
    new.created_by := auth.uid();
  end if;
  return new;
end $$;

create or replace function public.set_updated_by()
returns trigger language plpgsql as $$
begin
  if auth.uid() is not null then
    new.updated_by := auth.uid();
  end if;
  return new;
end $$;


-- =====================================================================
-- 2. TABELAS
-- =====================================================================

-- ---------- profiles (1:1 com auth.users) ----------
create table public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  username     text not null unique
               check (username ~ '^[a-z0-9_]{2,20}$'),
  display_name text not null check (char_length(btrim(display_name)) between 1 and 40),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- ---------- workspaces ----------
create table public.workspaces (
  id         uuid primary key default gen_random_uuid(),
  name       text not null default 'Nosso espaço'
             check (char_length(btrim(name)) between 1 and 80),
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------- workspace_members ----------
-- unique(user_id): cada usuário pertence a um único workspace.
create table public.workspace_members (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id      uuid not null unique references public.profiles(id) on delete cascade,
  role         text not null default 'member' check (role in ('owner', 'member')),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- ---------- lists ----------
create table public.lists (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  title        text not null check (char_length(btrim(title)) between 1 and 200),
  created_by   uuid references public.profiles(id) on delete set null,
  deleted_at   timestamptz,
  version      integer not null default 1,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  -- necessário para a chave estrangeira composta de list_items
  constraint lists_id_workspace_uniq unique (id, workspace_id)
);

-- ---------- list_items ----------
-- A FK composta (list_id, workspace_id) garante que o item tem o mesmo
-- workspace da lista; não dá para "plantar" um item em workspace alheio.
create table public.list_items (
  id           uuid primary key default gen_random_uuid(),
  list_id      uuid not null,
  workspace_id uuid not null,
  text         text not null check (char_length(btrim(text)) between 1 and 500),
  note         text check (char_length(note) <= 2000),
  is_done      boolean not null default false,
  -- ordem: novos itens vão para o fim; reordenar = valor entre vizinhos
  position     double precision not null
               default (extract(epoch from clock_timestamp()))::double precision,
  created_by   uuid references public.profiles(id) on delete set null,
  version      integer not null default 1,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  constraint list_items_list_fk
    foreign key (list_id, workspace_id)
    references public.lists (id, workspace_id) on delete cascade
);

-- ---------- tasks ----------
create table public.tasks (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  title        text not null check (char_length(btrim(title)) between 1 and 200),
  description  text check (char_length(description) <= 5000),
  is_done      boolean not null default false,
  completed_at timestamptz,
  priority     text not null default 'medium' check (priority in ('low', 'medium', 'high')),
  due_date     date,
  assignee_id  uuid references public.profiles(id) on delete set null,
  created_by   uuid references public.profiles(id) on delete set null,
  deleted_at   timestamptz,
  version      integer not null default 1,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- ---------- notes ----------
create table public.notes (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  title        text not null default 'Sem título' check (char_length(title) <= 200),
  content      text not null default '' check (char_length(content) <= 100000),
  created_by   uuid references public.profiles(id) on delete set null,
  updated_by   uuid references public.profiles(id) on delete set null,
  deleted_at   timestamptz,
  version      integer not null default 1,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- ---------- plans ----------
-- type = tipo do planejamento (trip, weekly, ...). Novos tipos NÃO exigem
-- migração: o formato de "data" é validado no frontend (zod) por tipo.
-- starts_on alimenta o card "próximos planejamentos" do dashboard.
create table public.plans (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  type         text not null check (type ~ '^[a-z_]{2,30}$'),
  title        text not null check (char_length(btrim(title)) between 1 and 200),
  data         jsonb not null default '{}'::jsonb check (jsonb_typeof(data) = 'object'),
  starts_on    date,
  created_by   uuid references public.profiles(id) on delete set null,
  updated_by   uuid references public.profiles(id) on delete set null,
  deleted_at   timestamptz,
  version      integer not null default 1,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- ---------- activities (histórico; escrito só por triggers) ----------
-- Registros são imutáveis para o cliente, por isso não há updated_at.
create table public.activities (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  actor_id     uuid references public.profiles(id) on delete set null,
  action       text not null,
  entity_type  text not null,
  entity_id    uuid,
  entity_title text,
  details      text,
  created_at   timestamptz not null default now()
);


-- =====================================================================
-- 3. ÍNDICES
-- =====================================================================
create index idx_members_workspace      on public.workspace_members (workspace_id);
create index idx_lists_workspace        on public.lists (workspace_id) where deleted_at is null;
create index idx_list_items_list_pos    on public.list_items (list_id, position);
create index idx_list_items_workspace   on public.list_items (workspace_id);
create index idx_tasks_workspace_done   on public.tasks (workspace_id, is_done) where deleted_at is null;
create index idx_tasks_workspace_due    on public.tasks (workspace_id, due_date) where deleted_at is null;
create index idx_tasks_assignee         on public.tasks (assignee_id);
create index idx_notes_workspace_upd    on public.notes (workspace_id, updated_at desc) where deleted_at is null;
create index idx_plans_workspace_start  on public.plans (workspace_id, starts_on) where deleted_at is null;
create index idx_activities_ws_created  on public.activities (workspace_id, created_at desc);


-- =====================================================================
-- 4. TRIGGERS DE DADOS
-- =====================================================================

-- updated_at nas tabelas sem versão
create trigger a_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();
create trigger a_updated_at before update on public.workspaces
  for each row execute function public.set_updated_at();
create trigger a_updated_at before update on public.workspace_members
  for each row execute function public.set_updated_at();

-- versão + autoria nas tabelas de conteúdo
do $do$
declare t text;
begin
  foreach t in array array['lists','list_items','tasks','notes','plans'] loop
    execute format(
      'create trigger a_bump_version before update on public.%I
         for each row execute function public.bump_version()', t);
    execute format(
      'create trigger a_set_created_by before insert on public.%I
         for each row execute function public.set_created_by()', t);
  end loop;
end $do$;

create trigger b_set_updated_by before insert or update on public.notes
  for each row execute function public.set_updated_by();
create trigger b_set_updated_by before insert or update on public.plans
  for each row execute function public.set_updated_by();

-- Máximo de 2 membros por workspace
create or replace function public.enforce_max_members()
returns trigger language plpgsql as $$
begin
  if (select count(*) from public.workspace_members
       where workspace_id = new.workspace_id) >= 2 then
    raise exception 'Este espaço já tem dois membros.';
  end if;
  return new;
end $$;

create trigger a_max_members before insert on public.workspace_members
  for each row execute function public.enforce_max_members();

-- completed_at automático nas tarefas
create or replace function public.trg_tasks_completed()
returns trigger language plpgsql as $$
begin
  if tg_op = 'INSERT' then
    new.completed_at := case when new.is_done then now() else null end;
  elsif new.is_done is distinct from old.is_done then
    new.completed_at := case when new.is_done then now() else null end;
  end if;
  return new;
end $$;

create trigger c_tasks_completed before insert or update on public.tasks
  for each row execute function public.trg_tasks_completed();

-- Cria o profile quando uma conta é criada em auth.users.
-- username = parte do e-mail antes do @ (ex.: artur@lovenote.app -> artur)
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_username text := lower(split_part(new.email, '@', 1));
begin
  insert into public.profiles (id, username, display_name)
  values (
    new.id,
    v_username,
    coalesce(nullif(new.raw_user_meta_data->>'display_name', ''), initcap(v_username))
  )
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();


-- =====================================================================
-- 5. HISTÓRICO DE ATIVIDADES (triggers; ninguém forja pelo cliente)
-- =====================================================================

-- Registra uma atividade. Com p_throttle, edições repetidas do mesmo
-- registro pela mesma pessoa em 10 min viram uma só (autosave de notas).
create or replace function public._log_activity(
  p_workspace   uuid,
  p_action      text,
  p_entity_type text,
  p_entity_id   uuid,
  p_title       text,
  p_details     text    default null,
  p_throttle    boolean default false
) returns void language plpgsql security definer set search_path = public as $$
declare
  v_actor uuid := auth.uid();
  v_id    uuid;
begin
  if p_throttle then
    select id into v_id
      from public.activities
     where workspace_id = p_workspace
       and entity_id    = p_entity_id
       and action       = p_action
       and actor_id is not distinct from v_actor
       and created_at   > now() - interval '10 minutes'
     order by created_at desc
     limit 1;

    if v_id is not null then
      update public.activities
         set created_at = now(), entity_title = p_title
       where id = v_id;
      return;
    end if;
  end if;

  insert into public.activities
    (workspace_id, actor_id, action, entity_type, entity_id, entity_title, details)
  values
    (p_workspace, v_actor, p_action, p_entity_type, p_entity_id, p_title, p_details);
end $$;

revoke execute on function public._log_activity(uuid, text, text, uuid, text, text, boolean)
  from public, anon, authenticated;

-- lists
create or replace function public.trg_log_lists()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    perform public._log_activity(new.workspace_id, 'list_created', 'list', new.id, new.title);
  elsif old.deleted_at is null and new.deleted_at is not null then
    perform public._log_activity(new.workspace_id, 'list_deleted', 'list', new.id, new.title);
  elsif new.deleted_at is null and new.title is distinct from old.title then
    perform public._log_activity(new.workspace_id, 'list_renamed', 'list', new.id, new.title, old.title);
  end if;
  return null;
end $$;

create trigger z_log after insert or update on public.lists
  for each row execute function public.trg_log_lists();

-- list_items (details = título da lista)
create or replace function public.trg_log_list_items()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_list text;
begin
  select title into v_list from public.lists where id = new.list_id;
  if tg_op = 'INSERT' then
    perform public._log_activity(new.workspace_id, 'item_added', 'list_item', new.id, new.text, v_list);
  elsif new.is_done is distinct from old.is_done then
    perform public._log_activity(
      new.workspace_id,
      case when new.is_done then 'item_checked' else 'item_unchecked' end,
      'list_item', new.id, new.text, v_list);
  end if;
  return null;
end $$;

create trigger z_log after insert or update on public.list_items
  for each row execute function public.trg_log_list_items();

-- tasks
create or replace function public.trg_log_tasks()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    perform public._log_activity(new.workspace_id, 'task_created', 'task', new.id, new.title);
  elsif old.deleted_at is null and new.deleted_at is not null then
    perform public._log_activity(new.workspace_id, 'task_deleted', 'task', new.id, new.title);
  elsif new.is_done is distinct from old.is_done then
    perform public._log_activity(
      new.workspace_id,
      case when new.is_done then 'task_completed' else 'task_reopened' end,
      'task', new.id, new.title);
  end if;
  return null;
end $$;

create trigger z_log after insert or update on public.tasks
  for each row execute function public.trg_log_tasks();

-- notes
create or replace function public.trg_log_notes()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    perform public._log_activity(new.workspace_id, 'note_created', 'note', new.id, new.title);
  elsif old.deleted_at is null and new.deleted_at is not null then
    perform public._log_activity(new.workspace_id, 'note_deleted', 'note', new.id, new.title);
  elsif new.deleted_at is null
        and (new.title is distinct from old.title or new.content is distinct from old.content) then
    perform public._log_activity(new.workspace_id, 'note_edited', 'note', new.id, new.title, null, true);
  end if;
  return null;
end $$;

create trigger z_log after insert or update on public.notes
  for each row execute function public.trg_log_notes();

-- plans
create or replace function public.trg_log_plans()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    perform public._log_activity(new.workspace_id, 'plan_created', 'plan', new.id, new.title, new.type);
  elsif old.deleted_at is null and new.deleted_at is not null then
    perform public._log_activity(new.workspace_id, 'plan_deleted', 'plan', new.id, new.title, new.type);
  elsif new.deleted_at is null
        and (new.title is distinct from old.title or new.data is distinct from old.data) then
    perform public._log_activity(new.workspace_id, 'plan_edited', 'plan', new.id, new.title, new.type, true);
  end if;
  return null;
end $$;

create trigger z_log after insert or update on public.plans
  for each row execute function public.trg_log_plans();


-- =====================================================================
-- 6. FUNÇÕES AUXILIARES DE RLS
-- =====================================================================
-- SECURITY DEFINER: leem workspace_members sem passar pelo RLS dessa
-- própria tabela, o que evita recursão infinita nas policies.

create or replace function public.is_workspace_member(ws uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.workspace_members wm
     where wm.workspace_id = ws
       and wm.user_id = (select auth.uid())
  );
$$;

create or replace function public.shares_workspace(other uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1
      from public.workspace_members a
      join public.workspace_members b on b.workspace_id = a.workspace_id
     where a.user_id = (select auth.uid())
       and b.user_id = other
  );
$$;

revoke execute on function public.is_workspace_member(uuid) from public, anon;
revoke execute on function public.shares_workspace(uuid)    from public, anon;
grant  execute on function public.is_workspace_member(uuid) to authenticated;
grant  execute on function public.shares_workspace(uuid)    to authenticated;


-- =====================================================================
-- 7. ROW LEVEL SECURITY
-- =====================================================================
alter table public.profiles          enable row level security;
alter table public.workspaces        enable row level security;
alter table public.workspace_members enable row level security;
alter table public.lists             enable row level security;
alter table public.list_items        enable row level security;
alter table public.tasks             enable row level security;
alter table public.notes             enable row level security;
alter table public.plans             enable row level security;
alter table public.activities        enable row level security;

-- ---------- profiles ----------
create policy profiles_select on public.profiles
  for select to authenticated
  using (id = (select auth.uid()) or public.shares_workspace(id));

create policy profiles_update on public.profiles
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- ---------- workspaces (sem INSERT/DELETE pelo cliente) ----------
create policy workspaces_select on public.workspaces
  for select to authenticated
  using (public.is_workspace_member(id));

create policy workspaces_update on public.workspaces
  for update to authenticated
  using (public.is_workspace_member(id))
  with check (public.is_workspace_member(id));

-- ---------- workspace_members (somente leitura pelo cliente) ----------
create policy members_select on public.workspace_members
  for select to authenticated
  using (user_id = (select auth.uid()) or public.is_workspace_member(workspace_id));

-- ---------- tabelas de conteúdo: mesmas 4 policies ----------
do $do$
declare t text;
begin
  foreach t in array array['lists','list_items','tasks','notes','plans'] loop
    execute format(
      'create policy "%1$s_select" on public.%1$I
         for select to authenticated
         using (public.is_workspace_member(workspace_id))', t);
    execute format(
      'create policy "%1$s_insert" on public.%1$I
         for insert to authenticated
         with check (public.is_workspace_member(workspace_id))', t);
    execute format(
      'create policy "%1$s_update" on public.%1$I
         for update to authenticated
         using (public.is_workspace_member(workspace_id))
         with check (public.is_workspace_member(workspace_id))', t);
    execute format(
      'create policy "%1$s_delete" on public.%1$I
         for delete to authenticated
         using (public.is_workspace_member(workspace_id))', t);
  end loop;
end $do$;

-- ---------- activities (somente leitura pelo cliente) ----------
create policy activities_select on public.activities
  for select to authenticated
  using (public.is_workspace_member(workspace_id));


-- =====================================================================
-- 8. PRIVILÉGIOS (defesa em profundidade, além do RLS)
-- =====================================================================
revoke all on all tables in schema public from anon;

revoke insert, update, delete on public.workspace_members from authenticated;
revoke insert, update, delete on public.activities        from authenticated;

revoke insert, delete, update on public.workspaces from authenticated;
grant  update (name)           on public.workspaces to authenticated;

revoke insert, delete, update on public.profiles from authenticated;
grant  update (display_name)   on public.profiles to authenticated;


-- =====================================================================
-- 9. REALTIME
-- =====================================================================
do $do$
declare t text;
begin
  foreach t in array array['lists','list_items','tasks','notes','plans','activities'] loop
    if not exists (
      select 1 from pg_publication_tables
       where pubname = 'supabase_realtime'
         and schemaname = 'public'
         and tablename = t
    ) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end $do$;