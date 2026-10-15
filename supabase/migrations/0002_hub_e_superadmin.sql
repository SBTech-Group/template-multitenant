-- Core do template (SBAGENTS MT-04, MT-05, HUB-02). Não editar por produto: correções vão em migration nova.

-- Superadmin da SB Tech: identificado só por app_metadata.is_system_admin (MT-05).
create or replace function public.is_system_admin()
returns boolean language sql stable as $$
  select coalesce((auth.jwt() -> 'app_metadata' ->> 'is_system_admin')::boolean, false);
$$;

-- Superadmin enxerga e opera todos os tenants.
create policy "system_admin_all" on public.tenants         for all using (public.is_system_admin()) with check (public.is_system_admin());
create policy "system_admin_all" on public.tenant_members  for all using (public.is_system_admin()) with check (public.is_system_admin());
create policy "system_admin_all" on public.subscriptions   for all using (public.is_system_admin()) with check (public.is_system_admin());
create policy "system_admin_all" on public.tenant_settings for all using (public.is_system_admin()) with check (public.is_system_admin());

-- Papéis aceitos em tenant_members (superadmin é criado pela tenant-provision).
alter table public.tenant_members
  add constraint tenant_members_role_check check (role in ('superadmin', 'admin', 'member', 'viewer'));

-- As policies de 0001 usam "for all": membro comum não deve alterar assinatura nem membros.
drop policy "tenant_isolation" on public.subscriptions;
create policy "tenant_read" on public.subscriptions for select using (tenant_id = public.current_tenant_id());

drop policy "tenant_isolation" on public.tenant_members;
create policy "tenant_read" on public.tenant_members for select using (tenant_id = public.current_tenant_id());

-- Tela de login: antes de entrar não há sessão, mas o app precisa saber se o
-- subdomínio existe e qual a identidade visual. Devolve só isso.
create or replace function public.tenant_publico(p_slug text)
returns table (id uuid, config jsonb)
language sql stable security definer set search_path = public as $$
  select t.id,
         jsonb_strip_nulls(jsonb_build_object(
           'nome_exibido', coalesce(s.config ->> 'nome_exibido', t.nome),
           'logo_url',     s.config ->> 'logo_url',
           'cor_primaria', s.config ->> 'cor_primaria',
           'font_sans',    s.config ->> 'font_sans'
         ))
  from public.tenants t
  left join public.tenant_settings s on s.tenant_id = t.id
  where t.slug = p_slug and t.status = 'ativo';
$$;

revoke all on function public.tenant_publico(text) from public;
grant execute on function public.tenant_publico(text) to anon, authenticated;
