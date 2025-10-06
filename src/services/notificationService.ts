import { apiClient } from '../utils/api';

export interface Notification {
  id: number;
  type: 'hours_exceeded' | 'system' | 'warning';
  title: string;
  message: string;
  monitor_id?: number;
  monitor_name?: string;
  created_at: string;
  is_read: boolean;
}

export interface HoursExceededNotification {
  monitor_id: number;
  monitor_name: string;
  hours_worked: number;
  date: string;
}

export const notificationService = {
  // Obtener notificaciones del admin
  async getNotifications(): Promise<Notification[]> {
    // Endpoint oficial: /api/notifications/list/
    const response = await apiClient.get<Notification[] | { notifications?: Notification[] }>(
      '/api/notifications/list/'
    );
    if (Array.isArray(response)) return response;
    return response.notifications || [];
  },

  // Marcar notificación como leída
  async markAsRead(notificationId: number): Promise<void> {
    return apiClient.patch(`/api/notifications/${notificationId}/mark-read/`);
  },

  // Marcar todas como leídas
  async markAllAsRead(): Promise<void> {
    try {
      // Intento 1: endpoint masivo del backend
      await apiClient.patch('/api/notifications/mark-all-read/');
    } catch {
      // Fallback: no existe endpoint masivo, marcar una por una
      try {
        const items = await this.getNotifications();
        const list: Notification[] = Array.isArray(items) ? items : (items as unknown as { notifications?: Notification[]; results?: Notification[] }).notifications || (items as unknown as { notifications?: Notification[]; results?: Notification[] }).results || [];
        const unread = list.filter((n: Notification) => !n.is_read);
        await Promise.all(unread.map((n: Notification) => this.markAsRead(n.id)));
      } catch {
        // Silencio errores
      }
    }
  },

  // Enviar notificación de horas excedidas (ya no necesario - automático)
  async notifyHoursExceeded(data: HoursExceededNotification): Promise<void> {
    return apiClient.post('/api/notifications/hours-exceeded/', data);
  },

  // Obtener contador de notificaciones no leídas
  async getUnreadCount(): Promise<number> {
    const response = await apiClient.get<{ unread_count?: number }>('/api/notifications/unread-count/');
    return response.unread_count ?? 0;
  },

  // Extras útiles según backend
  async getUnread(): Promise<Notification[]> {
    const response = await apiClient.get<Notification[] | { notifications?: Notification[] }>(
      '/api/notifications/unread/'
    );
    if (Array.isArray(response)) return response;
    return response.notifications || [];
  },

  async getSummary(): Promise<{ total?: number; unread?: number } & Record<string, unknown>> {
    return apiClient.get('/api/notifications/summary/');
  },
};
