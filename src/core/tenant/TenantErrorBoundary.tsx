// ⚠️ Core do template. Não editar por produto.
import { useTenant } from '@/core/tenant/useTenant'

export function TenantErrorBoundary({ children }: { children: React.ReactNode }) {
  const { error, loading } = useTenant()

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center p-6">
        <div className="max-w-md space-y-3 text-center">
          <p className="text-destructive font-medium">Erro de configuração</p>
          <p className="text-muted-foreground text-sm font-mono">{error}</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
