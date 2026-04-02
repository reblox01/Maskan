import { Routes, Route } from 'react-router-dom'
import { AuthProvider } from '@/context/AuthContext'
import Navbar from '@/components/Navbar'
import DashboardLayout from '@/components/DashboardLayout'
import Home from '@/pages/Home'
import Properties from '@/pages/Properties'
import PropertyDetail from '@/pages/PropertyDetail'
import Login from '@/pages/Login'
import Register from '@/pages/Register'
import Estimate from '@/pages/Estimate'
import DashboardHome from '@/pages/dashboard/DashboardHome'
import DashboardProperties from '@/pages/dashboard/DashboardProperties'
import AddProperty from '@/pages/dashboard/AddProperty'
import DashboardStats from '@/pages/dashboard/DashboardStats'
import SavedProperties from '@/pages/dashboard/SavedProperties'
import Profile from '@/pages/dashboard/Profile'
import Settings from '@/pages/dashboard/Settings'
import UserManagement from '@/pages/dashboard/UserManagement'
import BecomeAgent from '@/pages/dashboard/BecomeAgent'
import AgentApplications from '@/pages/dashboard/AgentApplications'
import ApplicationFields from '@/pages/dashboard/ApplicationFields'

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

            {/* Dashboard routes */}
            <Route path="/dashboard" element={<DashboardLayout />}>
              <Route index element={<DashboardHome />} />
              <Route path="properties" element={<DashboardProperties />} />
              <Route path="add-property" element={<AddProperty />} />
              <Route path="user-management" element={<UserManagement />} />
              <Route path="stats" element={<DashboardStats />} />
              <Route path="saved" element={<SavedProperties />} />
              <Route path="profile" element={<Profile />} />
              <Route path="settings" element={<Settings />} />
              <Route path="become-agent" element={<BecomeAgent />} />
              <Route path="agent-applications" element={<AgentApplications />} />
              <Route path="application-fields" element={<ApplicationFields />} />
            </Route>
          </Routes>
        </main>
      </div>
    </AuthProvider>
  )
}
