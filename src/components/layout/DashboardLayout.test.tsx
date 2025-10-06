import { render } from '@testing-library/react'
import DashboardLayout from './DashboardLayout'
import { AuthProvider } from '../../context/AuthProvider'

// Mock del hook useAuth
vi.mock('../../hooks/useAuth', () => ({
  useAuth: () => ({
    user: { role: 'admin' },
    logout: vi.fn()
  })
}))

test('DashboardLayout renders without crashing', () => {
  render(
    <AuthProvider>
      <DashboardLayout />
    </AuthProvider>
  )
  // Test básico de renderizado
})

test('DashboardLayout has layout structure', () => {
  const { container } = render(
    <AuthProvider>
      <DashboardLayout />
    </AuthProvider>
  )
  expect(container.firstChild).toBeInTheDocument()
})
