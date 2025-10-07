import React from 'react';
import { X, AlertTriangle, CheckCircle, User, Calendar, FileText } from 'lucide-react';
import type { Computer, Report } from '../../types/index';
import { useAuth } from '../../hooks/useAuth';

interface ReportModalProps {
  computer: Computer;
  reports: Report[];
  onClose: () => void;
  onUpdateReportStatus?: (reportId: string, newStatus: 'pending' | 'resolved') => Promise<void>;
  onDeleteReport?: (reportId: string) => Promise<void>;
}

const ReportModal: React.FC<ReportModalProps> = ({ computer, reports, onClose, onUpdateReportStatus, onDeleteReport }) => {
  const { user } = useAuth();
  const [updatingId, setUpdatingId] = React.useState<string | null>(null);
  const [deletingId, setDeletingId] = React.useState<string | null>(null);
  const getStatusIcon = (status: string) => {
    return status === 'operational' ? (
      <CheckCircle size={20} className="status-icon operational" />
    ) : (
      <AlertTriangle size={20} className="status-icon faulty" />
    );
  };

  const getStatusText = (status: string) => {
    return status === 'operational' ? 'Operativo' : 'Con fallas';
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content large-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Información del Equipo</h2>
          <button className="close-btn" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <div className="computer-info">
          <div className="info-row">
            <span className="info-label">Equipo:</span>
            <span className="info-value">PC {computer.number}</span>
          </div>
          <div className="info-row">
            <span className="info-label">Serie:</span>
            <span className="info-value">{computer.serial}</span>
          </div>
          <div className="info-row">
            <span className="info-label">Estado:</span>
            <span className={`info-value status-${computer.status}`}>
              {getStatusIcon(computer.status)}
              {getStatusText(computer.status)}
            </span>
          </div>
        </div>

        <div className="reports-section">
          <h3 className="reports-title">
            <FileText size={20} />
            Reportes de Fallas
          </h3>
          
          {reports.length === 0 ? (
            <div className="no-reports">
              <p>No hay reportes de fallas para este equipo.</p>
            </div>
          ) : (
            <div className="reports-list">
              {reports.map((report, index) => (
                <div key={report.id} className="report-card">
                  <div className="report-header">
                    <div className="report-number">Reporte #{index + 1}</div>
                    <div className="report-status-container">
                      <div className={`report-status ${report.status}`}>
                        {report.status === 'pending' ? 'Pendiente' : 'Resuelto'}
                      </div>
                      {user?.role === 'admin' && onUpdateReportStatus && (
                        <button
                          className={`status-toggle-btn ${report.status}`}
                          disabled={updatingId === report.id}
                          onClick={async () => {
                            const newStatus = report.status === 'pending' ? 'resolved' : 'pending';
                            try {
                              setUpdatingId(report.id);
                              await onUpdateReportStatus(report.id, newStatus);
                            } finally {
                              setUpdatingId(null);
                            }
                          }}
                          title={report.status === 'pending' ? 'Marcar como resuelto' : 'Marcar como pendiente'}
                        >
                          {updatingId === report.id ? '...' : (report.status === 'pending' ? '✓ Resolver' : '↶ Reabrir')}
                        </button>
                      )}
                      {user?.role === 'admin' && onDeleteReport && (
                        <button
                          className="status-toggle-btn danger"
                          disabled={deletingId === report.id}
                          onClick={async () => {
                            const proceed = await new Promise<boolean>(resolve => {
                              const detail = {
                                title: 'Eliminar reporte',
                                message: '¿Eliminar este reporte? Esta acción no se puede deshacer.',
                                confirmText: 'Eliminar',
                                cancelText: 'Cancelar',
                                onConfirm: () => resolve(true),
                                onCancel: () => resolve(false)
                              };
                              window.dispatchEvent(new CustomEvent('app-confirm', { detail }));
                            });
                            if (!proceed) return;
                            try {
                              setDeletingId(report.id);
                              await onDeleteReport(report.id);
                            } finally {
                              setDeletingId(null);
                            }
                          }}
                          title="Eliminar reporte"
                        >
                          {deletingId === report.id ? '...' : '🗑 Eliminar'}
                        </button>
                      )}
                    </div>
                  </div>
                  
                  <div className="report-info">
                    <div className="report-row">
                      <span className="report-label">
                        <User size={16} />
                        Reportado por:
                      </span>
                      <span className="report-value">{report.reporter}</span>
                    </div>
                    
                    <div className="report-row">
                      <span className="report-label">
                        <Calendar size={16} />
                        Fecha:
                      </span>
                      <span className="report-value">{report.date}</span>
                    </div>
                    
                    <div className="report-row">
                      <span className="report-label">Tipo de fallas:</span>
                      <div className="issues-list">
                        {report.issues && report.issues.length > 0 ? (
                          report.issues.map((issue, idx) => (
                            <span key={idx} className="issue-tag">
                              {issue}
                            </span>
                          ))
                        ) : (
                          <span className="issue-tag neutral">No especificado</span>
                        )}
                      </div>
                    </div>
                    
                    <div className="report-row full-width">
                      <span className="report-label">Descripción:</span>
                      <p className="report-description">{report.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="modal-actions">
          <button className="btn btn-primary" onClick={onClose}>
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReportModal;
