import { Routes, Route, Navigate } from 'react-router-dom'
import Login from './components/layout/Login'
import DashboardLayout from './components/layout/DashboardLayout'
import { ProtectedRoute } from './components/ProtectedRoute'
import './App.css'

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
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