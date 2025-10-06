import { Routes, Route, Navigate } from 'react-router-dom'
import Login from './components/layout/Login'
import Register from './components/layout/Register'
import DashboardLayout from './components/layout/DashboardLayout'
import MainLayout from './components/layout/MainLayout'
import { ProtectedRoute } from './components/ProtectedRoute'
import BlankPage from './components/layout/BlankPage'
import './App.css'
import ForgotPassword from './components/layout/ForgotPassword';
import ResetPassword from './components/layout/ResetPassword';
import AdminApproval from './components/layout/AdminApproval';

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/admin/approval" element={<AdminApproval />} />
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <DashboardLayout />
        </ProtectedRoute>
      } />
      <Route path="/home" element={
        <ProtectedRoute>
          <DashboardLayout />
        </ProtectedRoute>
      } />
      <Route path="/inventory" element={
        <ProtectedRoute>
          <MainLayout>
            <BlankPage 
              title="Inventario" 
              description="Gestión de inventario y recursos de las salas."
            />
          </MainLayout>
        </ProtectedRoute>
      } />
      <Route path="/reports" element={
        <ProtectedRoute>
          <MainLayout>
            <BlankPage 
              title="Reportes" 
              description="Análisis y reportes de uso de las salas."
            />
          </MainLayout>
        </ProtectedRoute>
      } />
      <Route path="/settings" element={
        <ProtectedRoute>
          <MainLayout>
            <BlankPage 
              title="Configuración" 
              description="Configuración del sistema y preferencias."
            />
          </MainLayout>
        </ProtectedRoute>
      } />
      <Route path="/" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}

export default App