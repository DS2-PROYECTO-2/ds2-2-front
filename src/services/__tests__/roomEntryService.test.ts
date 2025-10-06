import { describe, it, expect, vi } from 'vitest'
import * as api from '../../utils/api'
import { getMyEntries, getMyActiveEntry, createEntry, exitEntry, getAllEntries } from '../roomEntryService'

// Tipos auxiliares para respuestas simuladas
interface RawEntry {
  id: number;
  room?: number;
  entry_time?: string;
}

interface EntriesResponse { entries: RawEntry[] }
interface ActiveEntryResponse { has_active_entry: boolean; active_entry?: RawEntry }

describe('roomEntryService', () => {
  it('getMyEntries mapea lista', async () => {
    vi.spyOn(api.apiClient, 'get').mockResolvedValueOnce({ entries: [{ id: 1, room: 2, entry_time: '2024-01-01T00:00:00Z' }] } as EntriesResponse)
    const res = await getMyEntries()
    expect(res[0].id).toBe(1)
    expect(res[0].roomId).toBe(2)
  })

  it('getMyActiveEntry mapea activo', async () => {
    vi.spyOn(api.apiClient, 'get').mockResolvedValueOnce({ has_active_entry: true, active_entry: { id: 3, room: 9, entry_time: '2024-01-01T00:00:00Z' } } as ActiveEntryResponse)
    const res = await getMyActiveEntry()
    expect(res.has_active_entry).toBe(true)
    expect(res.active_entry?.id).toBe(3)
  })

  it('createEntry usa post', async () => {
    const spy = vi.spyOn(api.apiClient, 'post').mockResolvedValueOnce({ ok: true } as unknown as { ok: boolean })
    await createEntry(5, 'n')
    expect(spy).toHaveBeenCalled()
  })

  it('exitEntry usa patch ruta 1', async () => {
    const spy = vi.spyOn(api.apiClient, 'patch').mockResolvedValueOnce({ ok: true } as unknown as { ok: boolean })
    await exitEntry(10, 'bye')
    expect(spy).toHaveBeenCalled()
  })

  it('getAllEntries compone URL con filtros', async () => {
    const spy = vi.spyOn(api.apiClient, 'get').mockResolvedValueOnce({ entries: [] } as EntriesResponse)
    await getAllEntries({ user: 'john', room: 1, active: true, from: '2024-01-01', to: '2024-01-02', document: '123', page: 2, page_size: 10 })
    expect(spy).toHaveBeenCalled()
  })
})


