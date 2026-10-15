// ⚠️ Core do template. Não editar por produto.
import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { TenantConfig } from '@/types/tenant'

interface TenantContextValue {
  tenantId: string | null
  config: TenantConfig | null
  slug: string
  loading: boolean
  error: string | null
}

const TenantContext = createContext<TenantContextValue | null>(null)

function resolveSlug(): string {
  const hostname = window.location.hostname

  // Em dev local, usa VITE_DEV_TENANT_SLUG para evitar loading infinito
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    const devSlug = import.meta.env.VITE_DEV_TENANT_SLUG
    return devSlug ?? ''
  }

  return hostname.split('.')[0]
}

export function TenantProvider({ children }: { children: React.ReactNode }) {
  const slug = resolveSlug()
  const [tenantId, setTenantId] = useState<string | null>(null)
  const [config, setConfig] = useState<TenantConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!slug) {
      setError(
        '[TenantProvider] Rodando em localhost sem VITE_DEV_TENANT_SLUG definida. ' +
        'Adicione VITE_DEV_TENANT_SLUG=<slug> no seu .env para desenvolvimento local.'
      )
      setLoading(false)
      return
    }

    async function load() {
      // Antes do login não há sessão: a RPC tenant_publico devolve só o que a
      // tela de entrada precisa (id e identidade visual), sem abrir a tabela.
      const { data, error: rpcErr } = await supabase.rpc('tenant_publico', { p_slug: slug })
      const tenant = (Array.isArray(data) ? data[0] : data) as { id: string; config: TenantConfig | null } | null

      if (rpcErr || !tenant) {
        setError(`[TenantProvider] Tenant "${slug}" não encontrado.`)
        setLoading(false)
        return
      }

      setTenantId(tenant.id)

      const c = tenant.config
      if (c && typeof c === 'object' && !Array.isArray(c)) {
        if (c.cor_primaria) document.documentElement.style.setProperty('--color-primary', c.cor_primaria)
        if (c.font_sans) document.documentElement.style.setProperty('--font-sans', c.font_sans)
        setConfig(c)
      }

      setLoading(false)
    }

    load()
  }, [slug])

  return (
    <TenantContext.Provider value={{ tenantId, config, slug, loading, error }}>
      {children}
    </TenantContext.Provider>
  )
}

export function useTenantContext() {
  const ctx = useContext(TenantContext)
  if (!ctx) throw new Error('useTenantContext deve ser usado dentro de TenantProvider')
  return ctx
}
