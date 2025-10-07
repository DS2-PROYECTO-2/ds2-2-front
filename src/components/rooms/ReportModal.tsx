import React from 'react';
import { X, AlertTriangle, CheckCircle, User, Calendar, FileText } from 'lucide-react';
import type { Computer, Report } from '../../types/index';
import { useAuth } from '../../hooks/useAuth';
import './ReportModal.css';

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
  const [showMineOnly, setShowMineOnly] = React.useState<boolean>(() => user?.role === 'monitor');
  const [filterFrom, setFilterFrom] = React.useState<string>('');
  const [filterTo, setFilterTo] = React.useState<string>('');
  const [filterUser, setFilterUser] = React.useState<string>('');

  const isMyReport = (r: Report) => {
    if (!user) return false;
    const removeDiacritics = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const norm = (s: string) => removeDiacritics(String(s || '').toLowerCase().trim());

    const reporterNorm = norm(r.reporter || '');
    const fullName = (user as unknown as { full_name?: string; fullName?: string }).full_name || (user as unknown as { fullName?: string }).fullName;
    const candidateValues = [user.username, fullName, user.email]
      .filter(Boolean)
      .map(v => norm(String(v)));

    // 1) Coincidencia por username/full_name/email (normalizado)
    if (candidateValues.some(c => c && reporterNorm.includes(c))) return true;

    // 2) Coincidencia por patrón "usuario {id}" o contiene el id del usuario
    const id = String(user.id);
    if (/usuario\s*\d+/i.test(r.reporter || '')) {
      const digits = (r.reporter || '').match(/(\d+)/);
      if (digits && digits[1] === id) return true;
    }
    if (reporterNorm === id || reporterNorm.endsWith(` ${id}`) || reporterNorm.includes(` ${id} `)) return true;

    return false;
  };
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
          <div className="reports-filters">
            {user?.role === 'monitor' && (
              <label className="reports-filter-item">
                <input
                  type="checkbox"
                  checked={showMineOnly}
                  onChange={(e) => setShowMineOnly(e.target.checked)}
                />
                <span>Solo mis reportes</span>
              </label>
            )}
            {user?.role === 'admin' && (
              <>
                <label className="reports-filter-item">
                  <span>Desde</span>
                  <input type="date" value={filterFrom} onChange={(e) => setFilterFrom(e.target.value)} />
                </label>
                <label className="reports-filter-item">
                  <span>Hasta</span>
                  <input type="date" value={filterTo} onChange={(e) => setFilterTo(e.target.value)} />
                </label>
                <label className="reports-filter-item">
                  <span>Usuario</span>
                  <input type="text" placeholder="Nombre o correo" value={filterUser} onChange={(e) => setFilterUser(e.target.value)} />
                </label>
              </>
            )}
          </div>
          
          {reports.length === 0 ? (
            <div className="no-reports">
              <p>No hay reportes de fallas para este equipo.</p>
            </div>
          ) : (
            <div className="reports-list">
              {(() => {
                let list = reports;
                // Filtro monitor: solo mis reportes
                if (showMineOnly && user) {
                  list = list.filter(r => (r.reporterId != null ? r.reporterId === user.id : isMyReport(r)));
                }
                // Filtros admin: fecha y usuario
                if (user?.role === 'admin') {
                  const parseEsDate = (s: string) => {
                    // esperado: dd/mm/yyyy, hh:mm
                    const [datePart] = s.split(',');
                    const [dd, mm, yyyy] = datePart.trim().split('/').map(Number);
                    return new Date(yyyy, (mm || 1) - 1, dd || 1, 0, 0, 0, 0);
                  };
                  if (filterFrom) {
                    const [y, m, d] = filterFrom.split('-').map(Number);
                    const from = new Date(y, (m || 1) - 1, d || 1, 0, 0, 0, 0);
                    list = list.filter(r => {
                      const dt = parseEsDate(r.date);
                      return dt >= from;
                    });
                  }
                  if (filterTo) {
                    const [y, m, d] = filterTo.split('-').map(Number);
                    const to = new Date(y, (m || 1) - 1, d || 1, 23, 59, 59, 999);
                    list = list.filter(r => {
                      const dt = parseEsDate(r.date);
                      return dt <= to;
                    });
                  }
                  if (filterUser.trim()) {
                    const q = filterUser.trim().toLowerCase();
                    list = list.filter(r => (r.reporterId != null && q === String(r.reporterId)) || (r.reporter || '').toLowerCase().includes(q));
                  }
                }
                return list;
              })().map((report, index) => (
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
