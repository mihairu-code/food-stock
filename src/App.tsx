import { QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router'
import { AuthGate } from '@/app/AuthGate'
import { HouseholdGate } from '@/app/HouseholdGate'
import { MergeGate } from '@/app/MergeGate'
import { ToastRegion } from '@/components/ToastRegion'
import { queryClient } from '@/data/queryClient'
import { HomeScreen } from '@/screens/home/HomeScreen'
import { Layout } from '@/screens/layout/Layout'
import { SettingsScreen } from '@/screens/settings/SettingsScreen'
import { ShoppingScreen } from '@/screens/shopping/ShoppingScreen'

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
