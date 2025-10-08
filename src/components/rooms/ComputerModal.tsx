import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import type { Computer, Room } from '../../types/index';

interface ComputerModalProps {
  computer: Computer | null;
  room: Room;
  onSave: (computerData: Omit<Computer, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onClose: () => void;
}

const ComputerModal: React.FC<ComputerModalProps> = ({ computer, room, onSave, onClose }) => {
  const [formData, setFormData] = useState({
    number: 0,
    serial: '',
    status: 'operational' as 'operational' | 'maintenance' | 'out_of_service'
  });

  useEffect(() => {
    if (computer) {
      setFormData({
        number: computer.number,
        serial: computer.serial,
        status: computer.status
      });
    } else {
      const nextNumber = room.computers.length + 1;
      setFormData(prev => ({
        number: nextNumber,
        serial: prev.serial || generateSerial(), // Solo generar si no existe
        status: 'operational'
      }));
    }
  }, [computer?.id, room.id]); // Solo dependemos de los IDs, no de los objetos completos

  function generateSerial(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let serial = '';
    for (let i = 0; i < 12; i++) {
      if (i > 0 && i % 4 === 0) serial += '-';
      serial += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return serial;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.number > 0 && formData.serial.trim()) {
      onSave({
        ...formData,
        roomId: room.id
      });
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'number' ? parseInt(value) || 0 : value
    }));
  };

  const generateNewSerial = () => {
    setFormData(prev => ({
      ...prev,
      serial: generateSerial()
    }));
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">
            {computer ? 'Editar Equipo' : 'Nuevo Equipo'}
          </h2>
          <button className="close-btn" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <div className="computer-info">
          <div className="info-row">
            <span className="info-label">Sala:</span>
            <span className="info-value">{room.name}</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label htmlFor="number">Número del equipo *</label>
            <input
              type="number"
              id="number"
              name="number"
              value={formData.number}
              onChange={handleChange}
              required
              min="1"
              placeholder="Número del equipo"
            />
          </div>

          <div className="form-group">
            <label htmlFor="serial">Número de serie *</label>
            <div className="serial-input-group">
              <input
                type="text"
                id="serial"
                name="serial"
                value={formData.serial}
                onChange={handleChange}
                required
                placeholder="Número de serie"
              />
              <button 
                type="button" 
                className="generate-serial-btn"
                onClick={generateNewSerial}
                title="Generar nuevo serial"
              >
                Generar
              </button>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="status">Estado del equipo</label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleChange}
            >
              <option value="operational">Operativo</option>
              <option value="maintenance">En mantenimiento</option>
              <option value="out_of_service">Fuera de servicio</option>
            </select>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-cancel" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary">
              {computer ? 'Actualizar' : 'Crear'} Equipo
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ComputerModal;
