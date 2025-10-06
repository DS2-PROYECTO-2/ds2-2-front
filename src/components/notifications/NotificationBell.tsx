import React, { useState, useEffect } from 'react';
import { Bell, BellRing } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { notificationService, type Notification } from '../../services/notificationService';

const NotificationBell: React.FC = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const notifs = await notificationService.getNotifications();
      const localUnreadCount = notifs.filter(n => !n.is_read).length;
      
      setNotifications(notifs);
      setUnreadCount(localUnreadCount);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: number) => {
    try {
      await notificationService.markAsRead(notificationId);
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      setMarkingAll(true);
      
      // Marcar todas las notificaciones no leídas individualmente
      const unreadNotifications = notifications.filter(n => !n.is_read);
      
      // Procesar todas las notificaciones no leídas en paralelo
      await Promise.all(
        unreadNotifications.map(notification => 
          notificationService.markAsRead(notification.id)
        )
      );
      
      // Actualizar el estado local
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all as read:', error);
    } finally {
      setMarkingAll(false);
    }
  };

  useEffect(() => {
    loadNotifications();
    // Recargar notificaciones cada 30 segundos
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, []);


  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Solo mostrar para admins
  if (user?.role !== 'admin') {
    return null;
  }

  return (
    <div className="notification-bell">
      <button
        className={`bell-button ${unreadCount > 0 ? 'has-notifications' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        title={`${unreadCount} notificaciones no leídas`}
      >
        {unreadCount > 0 ? <BellRing size={20} /> : <Bell size={20} />}
        {unreadCount > 0 && (
          <span className="notification-badge">{unreadCount}</span>
        )}
      </button>

      {isOpen && (
        <div className="notification-dropdown">
          <div className="notification-header">
            <h3>Notificaciones</h3>
            {unreadCount > 0 && (
              <button 
                className="mark-all-read-btn"
                onClick={markAllAsRead}
                disabled={markingAll}
              >
                {markingAll ? 'Limpiando...' : 'Limpiar'}
              </button>
            )}
          </div>

          <div className="notification-list">
            {loading ? (
              <div className="loading">Cargando notificaciones...</div>
            ) : notifications.length === 0 ? (
              <div className="no-notifications">No hay notificaciones</div>
            ) : (
              notifications.map(notification => (
                <div
                  key={notification.id}
                  className={`notification-item ${!notification.is_read ? 'unread' : ''}`}
                  onClick={() => !notification.is_read && markAsRead(notification.id)}
                >
                  <div className="notification-content">
                    <h4>{notification.title}</h4>
                    <p>{notification.message}</p>
                    {notification.monitor_name && (
                      <span className="monitor-info">
                        Monitor: {notification.monitor_name}
                      </span>
                    )}
                    <time>{formatDate(notification.created_at)}</time>
                  </div>
                  {!notification.is_read && <div className="unread-indicator" />}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
