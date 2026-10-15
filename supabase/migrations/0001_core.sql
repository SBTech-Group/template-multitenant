-- ⚠️ Core do template. Não editar por produto.
-- Migration base obrigatória em todos os produtos. Padrão em SBAGENTS standards/arquitetura.md (Multi-tenancy).

-- 1. Tenants (clientes do produto)
create table public.tenants (
  id         uuid primary key default gen_random_uuid(),
  slug       text unique not null,
  nome       text not null,
  plano      text default 'essencial',
  status     text default 'ativo',      -- 'ativo' | 'suspenso' | 'cancelado'
  created_at timestamptz default now()
);

-- 2. Membros (usuários vinculados a tenants)
create table public.tenant_members (
  tenant_id uuid references public.tenants(id) on delete cascade,
  user_id   uuid references auth.users(id) on delete cascade,
  role      text default 'member',      -- 'admin' | 'member' | 'viewer'
  primary key (tenant_id, user_id)
);

-- 3. Módulos ativos por tenant (o Hub sincroniza pela tenant-provision)
create table public.subscriptions (
  tenant_id  uuid references public.tenants(id) on delete cascade,
  module     text not null,
  active     boolean default true,
  expires_at timestamptz,
  primary key (tenant_id, module)
);

-- 4. Configurações visuais e comportamentais por tenant
create table public.tenant_settings (
  tenant_id uuid primary key references public.tenants(id) on delete cascade,
  config    jsonb default '{}'
  -- ex: {"cor_primaria":"#e63946","logo_url":"...","nome_exibido":"Arena X"}
);

-- Índices nas FKs
create index idx_tenant_members_tenant on public.tenant_members(tenant_id);
create index idx_tenant_members_user   on public.tenant_members(user_id);
create index idx_subscriptions_tenant  on public.subscriptions(tenant_id);

-- RLS nas tabelas core
alter table public.tenants         enable row level security;
alter table public.tenant_members  enable row level security;
alter table public.subscriptions   enable row level security;
alter table public.tenant_settings enable row level security;

-- Função helper obrigatória — base de toda segurança do sistema
create or replace function public.current_tenant_id()
returns uuid language sql stable as $$
  select (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid;
$$;

-- Policies core
-- tenants: membro pode ler o próprio tenant
create policy "tenant_read_own" on public.tenants
  for select using (
    id = public.current_tenant_id()
  );

-- tenant_members: membro vê apenas registros do seu tenant
create policy "tenant_isolation" on public.tenant_members
  for all using (tenant_id = public.current_tenant_id());

-- subscriptions: membro vê apenas assinaturas do seu tenant
create policy "tenant_isolation" on public.subscriptions
  for all using (tenant_id = public.current_tenant_id());

-- tenant_settings: membro vê apenas config do seu tenant
create policy "tenant_isolation" on public.tenant_settings
  for all using (tenant_id = public.current_tenant_id());
