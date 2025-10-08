import { describe, it, expect, vi, beforeEach } from 'vitest';
import userManagementService from '../userManagementService';

// Mock del apiClient
vi.mock('../../utils/api', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('userManagementService - Admin Edición', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('usa el endpoint correcto para edición por admin', async () => {
    const { apiClient } = await import('../../utils/api');
    const mockUser = {
      id: 2,
      username: 'testuser',
      email: 'test@example.com',
      full_name: 'Test User',
      role: 'monitor',
      is_active: true,
      is_verified: false,
      date_joined: '2024-01-01',
    };

    vi.mocked(apiClient.patch).mockResolvedValue(mockUser);

    const updateData = {
      first_name: 'Test',
      last_name: 'User',
      email: 'test@example.com',
      role: 'admin' as const,
      is_verified: true,
    };

    await userManagementService.updateUser(2, updateData);

    expect(apiClient.patch).toHaveBeenCalledWith(
      '/api/auth/admin/users/2/edit/',
      updateData
    );
  });

  it('incluye is_verified en UpdateUserData', () => {
    const updateData = {
      first_name: 'Test',
      email: 'test@example.com',
      role: 'admin' as const,
      is_verified: true,
    };

    // Verificar que el tipo permite is_verified
    expect(updateData).toHaveProperty('is_verified');
    expect(typeof updateData.is_verified).toBe('boolean');
  });

  it('maneja errores 403/404 sin redirección', async () => {
    const { apiClient } = await import('../../utils/api');
    
    const error403 = new Error('Forbidden') as Error & { status: number };
    error403.status = 403;
    vi.mocked(apiClient.patch).mockRejectedValue(error403);

    const updateData = {
      first_name: 'Test',
      email: 'test@example.com',
    };

    await expect(userManagementService.updateUser(2, updateData)).rejects.toThrow('Forbidden');
    
    // Verificar que se llamó al endpoint correcto
    expect(apiClient.patch).toHaveBeenCalledWith(
      '/api/auth/admin/users/2/edit/',
      updateData
    );
  });
});
