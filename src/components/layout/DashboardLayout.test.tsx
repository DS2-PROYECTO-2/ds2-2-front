import { render } from '@testing-library/react'
import DashboardLayout from './DashboardLayout'
import { AuthProvider } from '../../context/AuthProvider'
import { vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'

// Mock del hook useAuth
vi.mock('../../hooks/useAuth', () => ({
  useAuth: () => ({
    user: { role: 'admin' },
    logout: vi.fn()
  })
}))

test('DashboardLayout renders without crashing', () => {
  render(
    <MemoryRouter initialEntries={["/"]}>
      <AuthProvider>
        <DashboardLayout />
      </AuthProvider>
    </MemoryRouter>
  )
  // Test básico de renderizado
})


test('DashboardLayout has layout structure', () => {
  const { container } = render(
    <MemoryRouter initialEntries={["/"]}>
      <AuthProvider>
        <DashboardLayout />
      </AuthProvider>
    </MemoryRouter>
  )
  expect(container.firstChild).toBeInTheDocument()
})
