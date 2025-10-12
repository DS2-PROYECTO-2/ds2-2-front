import { render, screen, waitFor } from '@testing-library/react'
import { vi } from 'vitest'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from '../../context/AuthProvider'
import RoomStatsRow from '../rooms/RoomStatsRow'

vi.mock('../../services/roomEntryService', () => ({
  getMyEntries: vi.fn().mockResolvedValue([])
}))

describe('RoomStatsRow', () => {
  it('renderiza con valores iniciales y actualiza', async () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <RoomStatsRow />
        </AuthProvider>
      </BrowserRouter>
    )
    expect(screen.getByText('Horas mensuales')).toBeInTheDocument()
    await waitFor(() => {
      expect(screen.getAllByText(/0 h 00 min/).length).toBeGreaterThan(0)
    })
  })
})


