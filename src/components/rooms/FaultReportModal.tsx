import React, { useState, useEffect } from 'react';
import { X, AlertCircle } from 'lucide-react';
import type { Computer } from '../../types';
import { useAuth } from '../../hooks/useAuth';
import '../../styles/RoomManagement.css';

interface FaultReportModalProps {
  computer: Computer;
  onSave: (reportData: {
    computerId: string;
    roomId: string;
    issues: string[];
    reporter: string;
    description: string;
  }) => void;
  onClose: () => void;
}

const FaultReportModal: React.FC<FaultReportModalProps> = ({ computer, onSave, onClose }) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    issues: [] as string[],
    reporter: '',
    description: ''
  });
  const [submitting, setSubmitting] = useState(false);

  // Establecer el nombre del usuario logueado automáticamente
  useEffect(() => {
    if (user) {
      const displayName = user.full_name || user.username;
      setFormData(prev => ({
        ...prev,
        reporter: displayName
      }));
    }
  }, [user]);

  const issueTypes = [
    { value: 'Pantalla', label: '🖥️ Pantalla' },
    { value: 'Teclado', label: '⌨️ Teclado' },
    { value: 'Mouse', label: '🖱️ Mouse' },
    { value: 'CPU', label: '💻 CPU' },
    { value: 'Audio', label: '🔊 Audio' },
    { value: 'Red', label: '🌐 Red' },
    { value: 'Software', label: '⚙️ Software' },
    { value: 'Otro', label: '❓ Otro' }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.issues.length === 0) {
      window.dispatchEvent(new CustomEvent('app-toast', { detail: { type: 'error', message: 'Por favor selecciona al menos un tipo de falla' } }));
      return;
    }
    if (!formData.reporter.trim()) {
      window.dispatchEvent(new CustomEvent('app-toast', { detail: { type: 'error', message: 'Por favor ingresa tu nombre' } }));
      return;
    }
    if (!formData.description.trim()) {
      window.dispatchEvent(new CustomEvent('app-toast', { detail: { type: 'error', message: 'Por favor describe el problema' } }));
      return;
    }

    try {
      setSubmitting(true);
      await onSave({
        computerId: computer.id,
        roomId: computer.roomId,
        issues: formData.issues,
        reporter: formData.reporter,
        description: formData.description
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleIssueChange = (issue: string, checked: boolean) => {
    if (checked) {
      setFormData(prev => ({
        ...prev,
        issues: [...prev.issues, issue]
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        issues: prev.issues.filter(i => i !== issue)
      }));
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">
            <AlertCircle size={24} />
            Reportar Falla
          </h2>
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
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label>Tipo de falla(s):</label>
            <div className="checkbox-group">
              {issueTypes.map(issue => (
                <label 
                  key={issue.value} 
                  className={`checkbox-label ${formData.issues.includes(issue.value) ? 'checked' : ''}`}
                >
                  <input
                    type="checkbox"
                    value={issue.value}
                    checked={formData.issues.includes(issue.value)}
                    onChange={(e) => handleIssueChange(issue.value, e.target.checked)}
                  />
                  <span>{issue.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="reporter">Nombre de quien reporta:</label>
            <input
              type="text"
              id="reporter"
              name="reporter"
              value={formData.reporter}
              readOnly
              className="readonly-input"
              placeholder="Se toma automáticamente del usuario logueado"
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">Descripción detallada:</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
              placeholder="Describe el problema con el mayor detalle posible..."
              rows={4}
            />
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-cancel" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Enviando...' : 'Enviar Reporte'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FaultReportModal;
