import { describe, it, expect, vi, beforeEach } from 'vitest';
import { roomManagementService } from '../roomManagementService';
import * as api from '../../utils/api';

describe('roomManagementService reports parsing', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('parsea issues desde issue_type CSV y formatea fecha sin segundos', async () => {
    // mock getReports endpoint
    vi.spyOn(api.apiClient, 'get').mockResolvedValueOnce({
      results: [
        {
          id: 1,
          equipment: 5,
          reported_by: 7,
          issue_description: 'Falla múltiple',
          issue_type: 'hardware, software',
          created_at: '2025-10-07T12:34:56Z',
          resolved: false,
        },
      ],
    } as any);

    const res = await roomManagementService.getReports();
    expect(res).toHaveLength(1);
    const r = res[0];
    expect(r.issues).toEqual(['hardware', 'software']);
    // fecha sin segundos: incluye "12:34" y no ":56"
    expect(r.date).toMatch(/\d{2}:\d{2}$/);
    expect(r.date).not.toMatch(/:\d{2}:\d{2}$/);
  });
});


