// 🏗️ Balde 2 (Esqueleto): estrutura igual, conteúdo varia por produto.
import { PRODUTO } from '@/config/produto'
import { useTenant } from '@/core/tenant/useTenant'

export function DashboardPage() {
  const { config } = useTenant()
  const tenantName = config?.nome_exibido ?? PRODUTO.nome

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Bem-vindo a {tenantName}</h1>
      <p className="text-muted-foreground text-sm max-w-lg">
        Este é o dashboard padrão do template. Substitua por conteúdo do produto.
      </p>
    </div>
  )
}
