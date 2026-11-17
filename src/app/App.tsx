import { QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router'
import { SectionsPage } from '@/pages/sections'
import { SettingsPage } from '@/pages/settings'
import { queryClient } from '@/shared/api'
import { ToastRegion } from '@/shared/ui'
import { AppLayout } from './layout/AppLayout'
import { AuthGate } from './providers/AuthGate'
import { HouseholdGate } from './providers/HouseholdGate'
import { MergeGate } from './providers/MergeGate'

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthGate>
        {(user) => (
          <MergeGate user={user} key={user.id}>
            <HouseholdGate user={user}>
              <BrowserRouter>
                <Routes>
                  <Route element={<AppLayout />}>
                    {/* «Дом» и «Покупки» рисует сам каркас: они остаются в памяти (AppLayout). */}
                    <Route index element={null} />
                    <Route path="shopping" element={null} />
                    <Route path="settings" element={<SettingsPage />} />
                    <Route path="settings/sections" element={<SectionsPage />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Route>
                </Routes>
              </BrowserRouter>
            </HouseholdGate>
          </MergeGate>
        )}
      </AuthGate>
      <ToastRegion />
    </QueryClientProvider>
  )
}
