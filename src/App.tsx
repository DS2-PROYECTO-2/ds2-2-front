import { Routes, Route, Navigate } from 'react-router-dom'
import Login from './components/layout/Login'
import Register from './components/layout/Register'
import DashboardLayout from './components/layout/DashboardLayout'
import { ProtectedRoute } from './components/ProtectedRoute'
import './App.css'
import ForgotPassword from './components/layout/ForgotPassword';

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <DashboardLayout />
        </ProtectedRoute>
      } />
      <Route path="/" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}

export default App