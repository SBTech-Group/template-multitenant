// POST /functions/v1/tenant-provision — o Hub cria ou atualiza um tenant (SBAGENTS integracoes/hub.md).
// Idempotente: chamar de novo com o mesmo slug sincroniza os módulos (mudança de plano).
// Autenticação: Bearer HUB_PROVISIONING_TOKEN. Publicada com verify_jwt = false.
// Secrets: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (injetados), HUB_PROVISIONING_TOKEN,
//          PRODUCT_DOMAIN, SYSTEM_ADMIN_EMAIL (padrão admin@sbtech-group.com).
import { createClient, type SupabaseClient } from 'jsr:@supabase/supabase-js@2'
import { cors, invalidProvision, isHub, json } from '../_shared/hub.ts'

const SYSTEM_ADMIN_EMAIL = Deno.env.get('SYSTEM_ADMIN_EMAIL') ?? 'admin@sbtech-group.com'
const PRODUCT_DOMAIN = Deno.env.get('PRODUCT_DOMAIN') ?? ''

async function findUserByEmail(db: SupabaseClient, email: string) {
  for (let page = 1; page < 50; page++) {
    const { data } = await db.auth.admin.listUsers({ page, perPage: 1000 })
    const users = data?.users ?? []
    const found = users.find((u) => u.email?.toLowerCase() === email.toLowerCase())
    if (found) return found
    if (users.length < 1000) return null
  }
  return null
}

async function addMember(db: SupabaseClient, tenant_id: string, user_id: string, role: string) {
  const { error } = await db.from('tenant_members').upsert({ tenant_id, user_id, role }, { onConflict: 'tenant_id,user_id' })
  if (error) throw new Error(`tenant_members: ${error.message}`)
}

/** Superadmin da SB Tech presente em todo tenant (MT-05). */
async function ensureSystemAdmin(db: SupabaseClient, tenant_id: string) {
  let user = await findUserByEmail(db, SYSTEM_ADMIN_EMAIL)
  if (!user) {
    const { data } = await db.auth.admin.createUser({ email: SYSTEM_ADMIN_EMAIL, email_confirm: true, app_metadata: { is_system_admin: true } })
    user = data?.user ?? null
  } else if (!user.app_metadata?.is_system_admin) {
    await db.auth.admin.updateUserById(user.id, { app_metadata: { ...user.app_metadata, is_system_admin: true } })
  }
  if (user) await addMember(db, tenant_id, user.id, 'superadmin')
}

/** Cria o admin do cliente com link de convite; se já existe, só vincula. O Hub envia o e-mail. */
async function ensureAdmin(db: SupabaseClient, email: string, tenant_id: string, url: string): Promise<string | null> {
  const { data, error } = await db.auth.admin.generateLink({ type: 'invite', email, options: { redirectTo: `${url}/welcome` } })
  let user = !error ? data?.user ?? null : null
  const invite = !error ? data?.properties?.action_link ?? null : null
  if (!user) user = await findUserByEmail(db, email)
  if (!user) throw new Error(`Não foi possível criar o usuário ${email}`)
  await db.auth.admin.updateUserById(user.id, { app_metadata: { ...user.app_metadata, tenant_id } })
  await addMember(db, tenant_id, user.id, 'admin')
  return invite
}

async function syncModules(db: SupabaseClient, tenant_id: string, modulos: string[]) {
  const { error: offErr } = await db.from('subscriptions').update({ active: false }).eq('tenant_id', tenant_id)
  if (offErr) throw new Error(`subscriptions: ${offErr.message}`)
  if (!modulos.length) return
  const { error } = await db.from('subscriptions').upsert(
    modulos.map((module) => ({ tenant_id, module, active: true })),
    { onConflict: 'tenant_id,module' },
  )
  if (error) throw new Error(`subscriptions: ${error.message}`)
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (req.method !== 'POST') return json({ error: 'Método não permitido.' }, 405)
  if (!await isHub(req)) return json({ error: 'Não autorizado.' }, 401)

  const body = await req.json().catch(() => null) as Record<string, unknown> | null
  const invalid = invalidProvision(body)
  if (invalid) return json({ error: invalid }, 400)
  if (!PRODUCT_DOMAIN) return json({ error: 'Secret PRODUCT_DOMAIN não configurado.' }, 500)

  const slug = body!.slug as string
  const nome = typeof body!.nome === 'string' ? body!.nome : slug
  const plano = typeof body!.plano === 'string' ? body!.plano : null
  const modulos = body!.modulos as string[]
  const admin_email = typeof body!.admin_email === 'string' ? body!.admin_email : null
  const config = (body!.config ?? {}) as Record<string, unknown>
  const subdomain_url = `https://${slug}.${PRODUCT_DOMAIN}`

  try {
    const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

    const { data: existing } = await db.from('tenants').select('id').eq('slug', slug).maybeSingle()
    let tenant_id = existing?.id as string | undefined

    if (!tenant_id) {
      const { data: created, error } = await db.from('tenants').insert({ slug, nome, plano }).select('id').single()
      if (error || !created) return json({ error: `Erro ao criar tenant: ${error?.message}` }, 500)
      tenant_id = created.id
      await db.from('tenant_settings').insert({
        tenant_id,
        config: {
          nome_exibido: nome,
          hub_assinatura_id: body!.assinatura_id ?? null,
          documento: config.documento ?? null,
        },
      })
    } else if (plano) {
      await db.from('tenants').update({ plano, status: 'ativo' }).eq('id', tenant_id)
    }

    await syncModules(db, tenant_id!, modulos)
    await ensureSystemAdmin(db, tenant_id!)
    const invite_link = admin_email ? await ensureAdmin(db, admin_email, tenant_id!, subdomain_url) : null

    return json({
      tenant_id,
      subdomain_url,
      invite_link,
      admin_invite_sent_to: admin_email,
      status: existing ? 'already_provisioned' : 'provisioned',
    })
  } catch (e) {
    return json({ error: (e as Error).message }, 500)
  }
})
