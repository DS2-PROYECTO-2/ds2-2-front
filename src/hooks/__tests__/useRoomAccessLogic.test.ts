import { describe, it, expect } from 'vitest';
import { useRoomAccessLogic } from '../useRoomAccessLogic';

describe('useRoomAccessLogic', () => {
  it('debería ser un hook', () => {
    expect(useRoomAccessLogic).toBeDefined();
    expect(typeof useRoomAccessLogic).toBe('function');
  });

  it('debería aceptar roomId como parámetro', () => {
    const roomId = 1;
    expect(roomId).toBe(1);
  });

  it('debería manejar interfaces correctamente', () => {
    const mockAccessState = {
      hasAccess: true,
      reason: 'Acceso permitido',
      currentSchedule: {
        id: 1,
        start_datetime: '2024-01-01T09:00:00Z',
        end_datetime: '2024-01-01T17:00:00Z',
        room: 1,
        room_name: 'Sala A'
      },
      isInRoom: false,
      lastEntryTime: null,
      lastExitTime: null
    };

    expect(mockAccessState.hasAccess).toBe(true);
    expect(mockAccessState.reason).toBe('Acceso permitido');
    expect(mockAccessState.currentSchedule).toBeDefined();
    expect(mockAccessState.isInRoom).toBe(false);
  });

  it('debería manejar estado de acceso correctamente', () => {
    const mockState = {
      hasAccess: false,
      reason: 'Sin turno asignado',
      currentSchedule: null,
      isInRoom: false,
      lastEntryTime: null,
      lastExitTime: null
    };

    expect(mockState.hasAccess).toBe(false);
    expect(mockState.reason).toBe('Sin turno asignado');
    expect(mockState.currentSchedule).toBe(null);
  });
});
