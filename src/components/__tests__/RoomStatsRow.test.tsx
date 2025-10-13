import { render, screen, waitFor } from '@testing-library/react'
import { vi } from 'vitest'
import RoomStatsRow from '../rooms/RoomStatsRow'

vi.mock('../../services/roomEntryService', () => ({
  getMyEntries: vi.fn().mockResolvedValue([])
}))

describe('RoomStatsRow', () => {
  it('renderiza con valores iniciales y actualiza', async () => {
    render(<RoomStatsRow />)
    expect(screen.getByText('Horas mensuales')).toBeInTheDocument()
    await waitFor(() => {
      expect(screen.getAllByText(/0 h 00 min/).length).toBeGreaterThan(0)
    })
  })
})


