import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout } from './components/layout/AppLayout'
import { ToastProvider } from './components/ui/Toast'
import { AuthProvider } from './features/auth/AuthContext'
import { HomePage } from './features/auth/HomePage'
import { LoginPage } from './features/auth/LoginPage'
import { ProtectedRoute } from './features/auth/ProtectedRoute'
import { ClientesPage } from './features/clientes'
import { CuentasPage } from './features/cuentas'
import { PagosPage } from './features/pagos'
import { PrestamosPage } from './features/prestamos'
import { TransferenciasPage } from './features/transferencias'

function App() {
  return (
    <>
      <div className="liquid-mesh-canvas" aria-hidden="true" />

      <BrowserRouter>
        <AuthProvider>
          <ToastProvider>
            <Routes>
              <Route path="/login" element={<LoginPage />} />

              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <AppLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<HomePage />} />
                <Route
                  path="clientes"
                  element={
                    <ProtectedRoute allowedRoles={['ADMIN']}>
                      <ClientesPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="cuentas"
                  element={
                    <ProtectedRoute allowedRoles={['ADMIN', 'CLIENTE']}>
                      <CuentasPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="pagos"
                  element={
                    <ProtectedRoute allowedRoles={['ADMIN', 'CLIENTE']}>
                      <PagosPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="transferencias"
                  element={
                    <ProtectedRoute allowedRoles={['ADMIN', 'CLIENTE']}>
                      <TransferenciasPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="prestamos"
                  element={
                    <ProtectedRoute allowedRoles={['ADMIN', 'CLIENTE']}>
                      <PrestamosPage />
                    </ProtectedRoute>
                  }
                />
              </Route>

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </ToastProvider>
        </AuthProvider>
      </BrowserRouter>
    </>
  )
}

export default App
