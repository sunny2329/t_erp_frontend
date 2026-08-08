import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { ThemeProvider } from './context/ThemeContext'
import { AuthProvider } from './context/AuthContext'
import { DataProvider } from './context/DataContext'
import { AppLayout } from './components/layout/AppLayout'
import { ProtectedRoute } from './components/layout/ProtectedRoute'
import { PageGuard } from './components/layout/PageGuard'

import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Loads from './pages/Loads'
import Dispatch from './pages/Dispatch'
import Customers from './pages/masters/Customers'
import Carriers from './pages/masters/Carriers'
import Drivers from './pages/masters/Drivers'
import Vehicles from './pages/masters/Vehicles'
import Trailers from './pages/masters/Trailers'
import Locations from './pages/masters/Locations'
import Terminals from './pages/masters/Terminals'
import Users from './pages/masters/Users'
import PublicRateConfirm from './pages/PublicRateConfirm'

const guarded = (route, Element) => (
  <PageGuard route={route}>
    <Element />
  </PageGuard>
)

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <DataProvider>
          <BrowserRouter>
            <Toaster position="top-right" toastOptions={{ duration: 2600 }} />
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/rate-confirm/:token/:assignmentId" element={<PublicRateConfirm />} />
              <Route
                element={
                  <ProtectedRoute>
                    <AppLayout />
                  </ProtectedRoute>
                }
              >
                <Route path="/dashboard" element={guarded('/dashboard', Dashboard)} />
                <Route path="/loads" element={guarded('/loads', Loads)} />
                <Route path="/dispatch" element={guarded('/dispatch', Dispatch)} />
                <Route path="/customers" element={guarded('/customers', Customers)} />
                <Route path="/carriers" element={guarded('/carriers', Carriers)} />
                <Route path="/drivers" element={guarded('/drivers', Drivers)} />
                <Route path="/vehicles" element={guarded('/vehicles', Vehicles)} />
                <Route path="/trailers" element={guarded('/trailers', Trailers)} />
                <Route path="/locations" element={guarded('/locations', Locations)} />
                <Route path="/terminals" element={guarded('/terminals', Terminals)} />
                <Route path="/users" element={guarded('/users', Users)} />
              </Route>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </BrowserRouter>
        </DataProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}
