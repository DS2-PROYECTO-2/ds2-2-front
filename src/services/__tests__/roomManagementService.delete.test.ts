import { describe, it, expect, vi } from 'vitest';
import { roomManagementService } from '../roomManagementService';
import { apiClient } from '../../utils/api';

describe('roomManagementService.deleteReport', () => {
  it('hace DELETE al endpoint correcto', async () => {
    const del = vi.spyOn(apiClient, 'delete').mockResolvedValueOnce({} as any);
    await roomManagementService.deleteReport('123');
    expect(del).toHaveBeenCalledWith('/api/equipment/reports/123/');
  });
});


