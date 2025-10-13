import React from 'react';
import { X, Clock, User, MapPin, Calendar, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { type Schedule } from '../../services/scheduleService';

interface ScheduleDetailsModalProps {
  schedule: Schedule | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (schedule: Schedule) => void;
  onDelete?: (scheduleId: number) => void;
  canEdit?: boolean;
  canDelete?: boolean;
}

const ScheduleDetailsModal: React.FC<ScheduleDetailsModalProps> = ({
  schedule,
  isOpen,
  onClose,
  onEdit,
  onDelete,
  canEdit = false,
  canDelete = false
}) => {
  if (!isOpen || !schedule) return null;


  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="status-icon active" />;
      case 'completed':
        return <CheckCircle className="status-icon completed" />;
      case 'cancelled':
        return <XCircle className="status-icon cancelled" />;
      default:
        return <AlertCircle className="status-icon" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return 'Activo';
      case 'completed':
        return 'Completado';
      case 'cancelled':
        return 'Cancelado';
      default:
        return 'Desconocido';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return '#10b981';
      case 'completed':
        return '#3b82f6';
      case 'cancelled':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  const calculateDuration = () => {
    const start = new Date(schedule.start_datetime);
    const end = new Date(schedule.end_datetime);
    const diffMs = end.getTime() - start.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (diffHours > 0) {
      return `${diffHours}h ${diffMinutes}m`;
    } else {
      return `${diffMinutes}m`;
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="schedule-details-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">
            <h3>Detalles del Turno</h3>
            <div className="schedule-status">
              {getStatusIcon(schedule.status)}
              <span style={{ color: getStatusColor(schedule.status) }}>
                {getStatusText(schedule.status)}
              </span>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-content">
          <div className="schedule-info-grid">
            <div className="info-item">
              <div className="info-icon">
                <User size={18} />
              </div>
              <div className="info-content">
                <div className="info-label">Monitor</div>
                <div className="info-value">
                  {schedule.user_full_name || schedule.user_name || `Monitor ${schedule.user}`}
                </div>
              </div>
            </div>

            <div className="info-item">
              <div className="info-icon">
                <MapPin size={18} />
              </div>
              <div className="info-content">
                <div className="info-label">Sala</div>
                <div className="info-value">
                  {schedule.room_name || `Sala ${schedule.room}`}
                </div>
              </div>
            </div>

            <div className="info-item">
              <div className="info-icon">
                <Calendar size={18} />
              </div>
              <div className="info-content">
                <div className="info-label">Fecha</div>
                <div className="info-value">
                  {new Date(schedule.start_datetime).toLocaleDateString('es-ES', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </div>
              </div>
            </div>

            <div className="info-item">
              <div className="info-icon">
                <Clock size={18} />
              </div>
              <div className="info-content">
                <div className="info-label">Horario</div>
                <div className="info-value">
                  {formatTime(schedule.start_datetime)} - {formatTime(schedule.end_datetime)}
                </div>
              </div>
            </div>

            <div className="info-item full-width">
              <div className="info-icon">
                <Clock size={18} />
              </div>
              <div className="info-content">
                <div className="info-label">Duración</div>
                <div className="info-value">
                  {calculateDuration()}
                </div>
              </div>
            </div>

            {schedule.notes && (
              <div className="info-item full-width">
                <div className="info-icon">
                  <AlertCircle size={18} />
                </div>
                <div className="info-content">
                  <div className="info-label">Notas</div>
                  <div className="info-value notes">
                    {schedule.notes}
                  </div>
                </div>
              </div>
            )}

            <div className="info-item full-width">
              <div className="info-content">
                <div className="info-label">Información del Sistema</div>
                <div className="system-info">
                  <div className="system-info-item">
                    <span className="system-label">ID del Turno:</span>
                    <span className="system-value">{schedule.id}</span>
                  </div>
                  <div className="system-info-item">
                    <span className="system-label">Creado:</span>
                    <span className="system-value">
                      {new Date(schedule.created_at).toLocaleString('es-ES')}
                    </span>
                  </div>
                  <div className="system-info-item">
                    <span className="system-label">Actualizado:</span>
                    <span className="system-value">
                      {new Date(schedule.updated_at).toLocaleString('es-ES')}
                    </span>
                  </div>
                  <div className="system-info-item">
                    <span className="system-label">Recurrente:</span>
                    <span className="system-value">
                      {schedule.recurring ? 'Sí' : 'No'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <div className="modal-actions">
            {canEdit && onEdit && (
              <button 
                className="btn btn-primary"
                onClick={() => {
                  if (schedule) {
                    onEdit(schedule);
                    onClose();
                  }
                }}
              >
                Editar Turno
              </button>
            )}
            {canDelete && onDelete && (
              <button 
                className="btn btn-danger"
                onClick={() => {
                  onDelete(schedule.id);
                  onClose();
                }}
              >
                Eliminar Turno
              </button>
            )}
            <button className="btn btn-secondary" onClick={onClose}>
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScheduleDetailsModal;
