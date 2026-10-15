// 🏗️ Balde 2 (Esqueleto): estrutura igual, conteúdo varia por produto.
import { BrowserRouter } from 'react-router-dom'
import { Providers } from '@/app/providers'
import { AppRouter } from '@/app/router'
import { TenantErrorBoundary } from '@/core/tenant/TenantErrorBoundary'

export default function App() {
  return (
    <BrowserRouter>
      <Providers>
        <TenantErrorBoundary>
          <AppRouter />
        </TenantErrorBoundary>
      </Providers>
    </BrowserRouter>
  )
}
