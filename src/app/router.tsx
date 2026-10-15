// 🏗️ Balde 2 (Esqueleto): estrutura igual, conteúdo varia por produto.
import { Routes, Route, Navigate } from 'react-router-dom'
import { useSubscriptions } from '@/core/tenant/useSubscriptions'
import { ProtectedRoute } from '@/core/auth/ProtectedRoute'
import { AppLayout } from '@/core/layout/AppLayout'
import { ALL_MODULES } from '@/app/menu'
import { modulosAtivos } from '@/lib/modules'
import { DashboardPage } from '@/pages/DashboardPage'
import { LoginPage } from '@/pages/auth/LoginPage'
import { ForgotPasswordPage } from '@/pages/auth/ForgotPasswordPage'
import { WelcomePage } from '@/pages/auth/WelcomePage'

export function AppRouter() {
  const { activeModules } = useSubscriptions()
  const moduleRoutes = modulosAtivos(ALL_MODULES, activeModules).flatMap((m) => m.routes)

  return (
    <Routes>
      {/* Públicas. /welcome recebe o convite do Hub e a redefinição de senha (HUB-02). */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/esqueci-senha" element={<ForgotPasswordPage />} />
      <Route path="/welcome" element={<WelcomePage />} />

      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<DashboardPage />} />
        {moduleRoutes.map((r) => (
          <Route key={r.path} path={r.path} element={r.element} />
        ))}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
