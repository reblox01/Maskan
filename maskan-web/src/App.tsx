import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AuthProvider, useAuth } from '@/context/AuthContext'
import Navbar from '@/components/Navbar'
import DashboardLayout from '@/components/DashboardLayout'
import Home from '@/pages/Home'
import Properties from '@/pages/Properties'
import PropertyDetail from '@/pages/PropertyDetail'
import Login from '@/pages/Login'
import Register from '@/pages/Register'
import Estimate from '@/pages/Estimate'
import Consulting from '@/pages/Consulting'
import VendeurSignupPage from '@/pages/VendeurSignupPage'
import DashboardHome from '@/pages/dashboard/DashboardHome'
import DashboardProperties from '@/pages/dashboard/DashboardProperties'
import AddProperty from '@/pages/dashboard/AddProperty'
import DashboardStats from '@/pages/dashboard/DashboardStats'
import SavedProperties from '@/pages/dashboard/SavedProperties'
import Profile from '@/pages/dashboard/Profile'
import Settings from '@/pages/dashboard/Settings'
import UserManagement from '@/pages/dashboard/UserManagement'
import BecomeVendeur from '@/pages/dashboard/BecomeVendeur'
import VendeurApplications from '@/pages/dashboard/VendeurApplications'
import ApplicationFields from '@/pages/dashboard/ApplicationFields'
import PropertyVerification from '@/pages/dashboard/PropertyVerification'

function ProtectedRoute({ children, requireVendeur = false, requireAdmin = false }: {
  children: React.ReactNode
  requireVendeur?: boolean
  requireAdmin?: boolean
}) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-teal-700 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (requireAdmin && user.role !== 'admin') {
    return <Navigate to="/dashboard" replace />
  }

  if (requireVendeur && user.role !== 'vendeur' && user.role !== 'admin') {
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}

export default function App() {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-background">
        <Navbar />
        <main>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Home />} />
            <Route path="/properties" element={<Properties />} />
            <Route path="/properties/:id" element={<PropertyDetail />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/estimate" element={<Estimate />} />
            <Route path="/consulting" element={<Consulting />} />
            <Route path="/vendeur-signup" element={
              <ProtectedRoute>
                <VendeurSignupPage />
              </ProtectedRoute>
            } />

            {/* Dashboard routes */}
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }>
              <Route index element={<DashboardHome />} />
              <Route path="properties" element={
                <ProtectedRoute requireVendeur>
                  <DashboardProperties />
                </ProtectedRoute>
              } />
              <Route path="add-property" element={
                <ProtectedRoute requireVendeur>
                  <AddProperty />
                </ProtectedRoute>
              } />
              <Route path="user-management" element={
                <ProtectedRoute requireAdmin>
                  <UserManagement />
                </ProtectedRoute>
              } />
              <Route path="stats" element={
                <ProtectedRoute requireVendeur>
                  <DashboardStats />
                </ProtectedRoute>
              } />
              <Route path="saved" element={<SavedProperties />} />
              <Route path="profile" element={<Profile />} />
              <Route path="settings" element={<Settings />} />
              <Route path="become-vendeur" element={<BecomeVendeur />} />
              <Route path="vendeur-applications" element={
                <ProtectedRoute requireAdmin>
                  <VendeurApplications />
                </ProtectedRoute>
              } />
              <Route path="property-verification" element={
                <ProtectedRoute requireAdmin>
                  <PropertyVerification />
                </ProtectedRoute>
              } />
              <Route path="application-fields" element={
                <ProtectedRoute requireAdmin>
                  <ApplicationFields />
                </ProtectedRoute>
              } />
            </Route>
          </Routes>
        </main>
      </div>
    </AuthProvider>
  )
}