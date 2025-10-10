import { describe, it, expect } from 'vitest';
import { parseRoomAccessError } from '../roomAccessErrors';

describe('roomAccessErrors', () => {
  describe('parseRoomAccessError', () => {
    it('debería parsear error de turno requerido', () => {
      const error = {
        response: {
          data: {
            error: 'Sin turno asignado para esta sala',
            details: { reason: 'schedule_required' }
          }
        }
      };

      const result = parseRoomAccessError(error);

      expect(result.type).toBe('schedule_required');
      expect(result.message).toContain('No tienes turno asignado');
    });

    it('debería parsear error de horario', () => {
      const error = {
        response: {
          data: {
            error: 'Acceso no permitido en este horario',
            details: { time: '14:00' }
          }
        }
      };

      const result = parseRoomAccessError(error);

      expect(result.type).toBe('time_mismatch');
      expect(result.message).toContain('El acceso no está permitido en este horario');
    });

    it('debería parsear error de sala', () => {
      const error = {
        response: {
          data: {
            error: 'No tienes acceso a esta sala',
            details: { room_id: 1 }
          }
        }
      };

      const result = parseRoomAccessError(error);

      expect(result.type).toBe('room_mismatch');
      expect(result.message).toContain('No tienes acceso a esta sala');
    });

    it('debería manejar error sin response', () => {
      const error = new Error('Network error');

      const result = parseRoomAccessError(error);

      expect(result.type).toBe('server_error');
      expect(result.message).toContain('Error inesperado');
    });

    it('debería manejar error desconocido', () => {
      const error = { unknown: 'error' };

      const result = parseRoomAccessError(error);

      expect(result.type).toBe('server_error');
      expect(result.message).toContain('Error inesperado');
    });

    it('debería manejar error null', () => {
      const result = parseRoomAccessError(null);

      expect(result.type).toBe('server_error');
      expect(result.message).toContain('Error inesperado');
    });
  });
});
