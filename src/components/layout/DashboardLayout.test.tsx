import { render } from '@testing-library/react'
import DashboardLayout from './DashboardLayout'

test('DashboardLayout renders without crashing', () => {
  render(<DashboardLayout />)
  // Test básico de renderizado
})

test('DashboardLayout has layout structure', () => {
  const { container } = render(<DashboardLayout />)
  expect(container.firstChild).toBeInTheDocument()
})
