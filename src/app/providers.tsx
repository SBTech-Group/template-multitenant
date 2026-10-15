// ⚠️ Core do template. Não editar por produto.
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from '@/core/auth/AuthProvider'
import { TenantProvider } from '@/core/tenant/TenantProvider'
import { Toaster } from 'sonner'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60,
      retry: 1,
    },
  },
})

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TenantProvider>
          {children}
          <Toaster richColors position="top-right" />
        </TenantProvider>
      </AuthProvider>
    </QueryClientProvider>
  )
}
