import { describe, it, expect } from 'vitest';
import roomAccessService from '../roomAccessService';

describe('roomAccessService', () => {
  it('debería ser un servicio', () => {
    expect(roomAccessService).toBeDefined();
    expect(typeof roomAccessService).toBe('object');
  });

  it('debería tener métodos definidos', () => {
    expect(typeof roomAccessService.validateRoomAccess).toBe('function');
    expect(typeof roomAccessService.registerRoomEntry).toBe('function');
    expect(typeof roomAccessService.registerRoomExit).toBe('function');
    expect(typeof roomAccessService.canAccessRoom).toBe('function');
    expect(typeof roomAccessService.getActiveSchedules).toBe('function');
    expect(typeof roomAccessService.getCurrentScheduleInfo).toBe('function');
  });

  it('debería manejar interfaces correctamente', () => {
    const mockRequest = {
      room_id: 1,
      access_type: 'entry' as const,
      access_datetime: '2024-01-01T10:00:00Z'
    };

    expect(mockRequest.room_id).toBe(1);
    expect(mockRequest.access_type).toBe('entry');
    expect(mockRequest.access_datetime).toBe('2024-01-01T10:00:00Z');
  });
});
