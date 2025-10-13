import { describe, it, expect } from 'vitest';
import { validateScheduleTime } from '../scheduleValidation';

describe('scheduleValidation', () => {
  describe('validateScheduleTime', () => {
    it('debería validar turno activo', () => {
      const now = new Date('2024-01-01T12:00:00Z');
      const start = new Date('2024-01-01T10:00:00Z');
      const end = new Date('2024-01-01T14:00:00Z');

      const result = validateScheduleTime(start, end, now);

      expect(result.isValid).toBe(true);
      expect(result.isActive).toBe(true);
      expect(result.reason).toBe('Turno activo');
    });

    it('debería validar turno expirado', () => {
      const now = new Date('2024-01-01T15:00:00Z');
      const start = new Date('2024-01-01T10:00:00Z');
      const end = new Date('2024-01-01T14:00:00Z');

      const result = validateScheduleTime(start, end, now);

      expect(result.isValid).toBe(false);
      expect(result.isExpired).toBe(true);
      expect(result.reason).toBe('El turno ya ha terminado');
    });

    it('debería manejar fechas inválidas', () => {
      const now = new Date('2024-01-01T12:00:00Z');
      const start = 'invalid-date';
      const end = 'invalid-date';

      const result = validateScheduleTime(start, end, now);

      expect(result.isValid).toBe(false);
      expect(result.reason).toBe('Fechas de turno inválidas');
    });

    it('debería manejar fechas como strings', () => {
      const now = new Date('2024-01-01T12:00:00Z');
      const start = '2024-01-01T10:00:00Z';
      const end = '2024-01-01T14:00:00Z';

      const result = validateScheduleTime(start, end, now);

      expect(result.isValid).toBe(true);
      expect(result.isActive).toBe(true);
    });
  });
});
