import { QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router'
import { AuthGate } from '@/app/AuthGate'
import { HouseholdGate } from '@/app/HouseholdGate'
import { MergeGate } from '@/app/MergeGate'
import { HomeScreen } from '@/pages/home/ui/HomeScreen'
import { SectionsScreen } from '@/pages/sections/ui/SectionsScreen'
import { SettingsScreen } from '@/pages/settings/ui/SettingsScreen'
import { ShoppingScreen } from '@/pages/shopping/ui/ShoppingScreen'
import { Layout } from '@/screens/layout/Layout'
import { queryClient } from '@/shared/api/queryClient'
import { ToastRegion } from '@/shared/ui/ToastRegion'

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthGate>
        {(user) => (
          <MergeGate user={user} key={user.id}>
            <HouseholdGate user={user}>
              <BrowserRouter>
                <Routes>
                  <Route element={<Layout />}>
                    <Route index element={<HomeScreen />} />
                    <Route path="shopping" element={<ShoppingScreen />} />
                    <Route path="settings" element={<SettingsScreen />} />
                    <Route path="settings/sections" element={<SectionsScreen />} />
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
