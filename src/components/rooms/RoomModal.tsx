import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import type { Room } from '../../types/index';

interface RoomModalProps {
  room: Room | null;
  onSave: (roomData: Omit<Room, 'id' | 'createdAt' | 'updatedAt' | 'computers'>) => void;
  onClose: () => void;
}

const RoomModal: React.FC<RoomModalProps> = ({ room, onSave, onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    capacity: 0,
    description: '',
    location: ''
  });

  useEffect(() => {
    if (room) {
      setFormData({
        name: room.name,
        capacity: room.capacity,
        description: room.description || '',
        location: room.location || ''
      });
    } else {
      setFormData({
        name: '',
        capacity: 0,
        description: '',
        location: ''
      });
    }
  }, [room]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name.trim() && formData.capacity > 0) {
      onSave(formData);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'capacity' ? parseInt(value) || 0 : value
    }));
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">
            {room ? 'Editar Sala' : 'Nueva Sala'}
          </h2>
          <button className="close-btn" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label htmlFor="name">Nombre de la sala *</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder="Ej: Sala A - Sistemas"
            />
          </div>

          <div className="form-group">
            <label htmlFor="capacity">Capacidad de equipos *</label>
            <input
              type="number"
              id="capacity"
              name="capacity"
              value={formData.capacity}
              onChange={handleChange}
              required
              min="1"
              placeholder="Número de equipos"
            />
          </div>

          <div className="form-group">
            <label htmlFor="location">Ubicación</label>
            <input
              type="text"
              id="location"
              name="location"
              value={formData.location}
              onChange={handleChange}
              placeholder="Ej: Edificio A, Piso 2"
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">Descripción</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Descripción de la sala..."
              rows={3}
            />
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-cancel" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary">
              {room ? 'Actualizar' : 'Crear'} Sala
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RoomModal;
