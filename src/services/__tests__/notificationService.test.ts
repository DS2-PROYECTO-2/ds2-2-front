import { describe, it, expect, vi, beforeEach } from 'vitest';
import { notificationService } from '../notificationService';
import { apiClient } from '../../utils/api';

// Mock del apiClient
vi.mock('../../utils/api', () => ({
  apiClient: {
    get: vi.fn(),
    patch: vi.fn()
  }
}));

describe('notificationService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getNotifications', () => {
    it('debe obtener las notificaciones correctamente', async () => {
      const mockNotifications = [
        {
          id: 1,
          type: 'hours_exceeded',
          title: 'Monitor excedió 8 horas',
          message: 'Juan Pérez ha excedido las 8 horas',
          created_at: '2024-01-01T10:00:00Z',
          is_read: false
        }
      ];

      vi.mocked(apiClient.get).mockResolvedValue({
        notifications: mockNotifications
      });

      const result = await notificationService.getNotifications();

      expect(apiClient.get).toHaveBeenCalledWith('/api/notifications/list/');
      expect(result).toEqual(mockNotifications);
    });

    it('debe retornar array vacío si no hay notificaciones', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({});

      const result = await notificationService.getNotifications();

      expect(result).toEqual([]);
    });
  });

  describe('markAsRead', () => {
    it('debe marcar una notificación como leída', async () => {
      const notificationId = 1;
      const mockResponse = { message: 'Notificación marcada como leída' };

      vi.mocked(apiClient.patch).mockResolvedValue(mockResponse);

      await notificationService.markAsRead(notificationId);

      expect(apiClient.patch).toHaveBeenCalledWith(`/api/notifications/${notificationId}/mark-read/`);
    });
  });

  describe('markAllAsRead', () => {
    it('debe marcar todas las notificaciones como leídas', async () => {
      const mockResponse = { message: 'Todas las notificaciones marcadas como leídas' };

      vi.mocked(apiClient.patch).mockResolvedValue(mockResponse);

      await notificationService.markAllAsRead();

      expect(apiClient.patch).toHaveBeenCalledWith('/api/notifications/mark-all-read/');
    });
  });

  describe('getUnreadCount', () => {
    it('debe obtener el contador de notificaciones no leídas', async () => {
      const mockResponse = { unread_count: 5 };

      vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

      const result = await notificationService.getUnreadCount();

      expect(apiClient.get).toHaveBeenCalledWith('/api/notifications/unread-count/');
      expect(result).toBe(5);
    });

    it('debe retornar 0 si no hay notificaciones no leídas', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({});

      const result = await notificationService.getUnreadCount();

      expect(result).toBe(0);
    });
  });
});
