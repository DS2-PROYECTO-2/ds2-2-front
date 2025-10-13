import { render } from '@testing-library/react'
import RightSidebar from '../layout/RightSidebar'

describe('RightSidebar', () => {
  it('renderiza sin crashear', () => {
    const { container } = render(<RightSidebar />)
    expect(container.querySelector('.right-sidebar')).not.toBeNull()
  })
})


