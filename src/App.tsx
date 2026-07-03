import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from '@/context/AuthContext'
import { ToastProvider } from '@/components/ui/Toast'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { Layout } from '@/components/Layout'
import { Login } from '@/pages/Login'
import { Dashboard } from '@/pages/Dashboard'
import { ShopsList } from '@/pages/shops/ShopsList'
import { ShopDetail } from '@/pages/shops/ShopDetail'
import { AssetsList } from '@/pages/assets/AssetsList'
import { LoansList } from '@/pages/loans/LoansList'
import { LoanCreate } from '@/pages/loans/LoanCreate'
import { LoanDetail } from '@/pages/loans/LoanDetail'
import { MovementsList } from '@/pages/movements/MovementsList'
import { AuditList } from '@/pages/audit/AuditList'
import { Approvals } from '@/pages/Approvals'
import { Reports } from '@/pages/Reports'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
      refetchOnWindowFocus: false,
    },
  },
})

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<Login />} />

              {/* ต้องล็อกอิน */}
              <Route element={<ProtectedRoute />}>
                <Route element={<Layout />}>
                  <Route index element={<Dashboard />} />

                  <Route path="shops" element={<ShopsList />} />
                  <Route path="shops/:id" element={<ShopDetail />} />

                  <Route path="assets" element={<AssetsList />} />

                  <Route path="loans" element={<LoansList />} />
                  <Route path="loans/new" element={<LoanCreate />} />
                  <Route path="loans/:id" element={<LoanDetail />} />

                  <Route path="movements" element={<MovementsList />} />
                  <Route path="audit" element={<AuditList />} />

                  {/* เฉพาะแอดมิน */}
                  <Route element={<ProtectedRoute roles={['admin']} />}>
                    <Route path="approvals" element={<Approvals />} />
                  </Route>

                  {/* แอดมิน + ผู้บริหาร */}
                  <Route element={<ProtectedRoute roles={['admin', 'executive']} />}>
                    <Route path="reports" element={<Reports />} />
                  </Route>
                </Route>
              </Route>

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </ToastProvider>
    </QueryClientProvider>
  )
}
