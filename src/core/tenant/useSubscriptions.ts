// ⚠️ Core do template. Não editar por produto.
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useTenant } from '@/core/tenant/useTenant'

export function useSubscriptions() {
  const { tenantId } = useTenant()
  const [activeModules, setActiveModules] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!tenantId) {
      setActiveModules([])
      setLoading(false)
      return
    }

    supabase
      .from('subscriptions')
      .select('module')
      .eq('tenant_id', tenantId)
      .eq('active', true)
      .then(({ data }) => {
        const rows = (data ?? []) as Array<{ module: string }>
        setActiveModules(rows.map((s) => s.module))
        setLoading(false)
      })
  }, [tenantId])

  return { activeModules, loading }
}
