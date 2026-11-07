import { QueryClientProvider, useQuery } from '@tanstack/react-query'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router'
import { HouseholdGate } from '@/app/HouseholdGate'
import { backend } from '@/data'
import { queryClient } from '@/data/queryClient'
import { HomeScreen } from '@/screens/home/HomeScreen'
import { Layout } from '@/screens/layout/Layout'
import { SettingsScreen } from '@/screens/settings/SettingsScreen'
import { ShoppingScreen } from '@/screens/shopping/ShoppingScreen'

function Screens() {
  const user = useQuery({ queryKey: ['user'], queryFn: () => backend.currentUser() })
  if (!user.data) return <p className="status">Загрузка…</p>
  return (
    <HouseholdGate user={user.data}>
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
  )
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Screens />
    </QueryClientProvider>
  )
}
