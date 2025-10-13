import { render } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from '../../context/AuthProvider'
import RightSidebar from '../layout/RightSidebar'

describe('RightSidebar', () => {
  it('renderiza sin crashear', () => {
    const { container } = render(
      <BrowserRouter>
        <AuthProvider>
          <RightSidebar />
        </AuthProvider>
      </BrowserRouter>
    )
    expect(container.querySelector('.right-sidebar')).not.toBeNull()
  })
})


