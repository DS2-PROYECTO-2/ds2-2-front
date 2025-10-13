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
      <Route path="/403" element={
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '100vh', 
          flexDirection: 'column',
          fontFamily: 'Arial, sans-serif'
        }}>
          <h1 style={{ color: '#e74c3c', marginBottom: '1rem' }}>403 - Acceso Denegado</h1>
          <p style={{ color: '#666', marginBottom: '2rem' }}>No tienes permisos para acceder a esta página.</p>
          <button 
            onClick={() => window.location.href = '/home'} 
            style={{
              padding: '10px 20px',
              backgroundColor: '#3498db',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            Volver al Inicio
          </button>
        </div>
      } />
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
          <DashboardLayout />
        </ProtectedRoute>
      } />
      <Route path="/users" element={
        <ProtectedRoute>
          <DashboardLayout />
        </ProtectedRoute>
      } />
      <Route path="/reports" element={
        <ProtectedRoute>
          <DashboardLayout />
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
      <Route path="/profile" element={
        <ProtectedRoute>
          <DashboardLayout />
        </ProtectedRoute>
      } />
      <Route path="/" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}

export default App