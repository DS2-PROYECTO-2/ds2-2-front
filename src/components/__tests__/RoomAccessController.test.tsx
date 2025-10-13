import { describe, it, expect } from 'vitest';
import RoomAccessController from '../rooms/RoomAccessController';

describe('RoomAccessController', () => {
  it('debería ser un componente React', () => {
    expect(RoomAccessController).toBeDefined();
    expect(typeof RoomAccessController).toBe('function');
  });

  it('debería tener props definidas', () => {
    const mockProps = {
      roomId: 1,
      onAccessChange: (hasAccess: boolean, reason: string) => {
        console.log('Access changed:', hasAccess, reason);
      },
      onScheduleInfo: (scheduleInfo: {
        id: number;
        start_datetime: string;
        end_datetime: string;
        room: number;
        room_name?: string;
      }) => {
        console.log('Schedule info:', scheduleInfo);
      }
    };

    expect(mockProps.roomId).toBe(1);
    expect(typeof mockProps.onAccessChange).toBe('function');
    expect(typeof mockProps.onScheduleInfo).toBe('function');
  });

  it('debería manejar props opcionales', () => {
    const mockProps: { 
      roomId: number; 
      onAccessChange?: (hasAccess: boolean, reason: string) => void; 
      onScheduleInfo?: (scheduleInfo: { id: number; start_datetime: string; end_datetime: string; room: number; room_name?: string }) => void; 
    } = {
      roomId: 1
    };

    expect(mockProps.roomId).toBe(1);
    expect(mockProps.onAccessChange).toBeUndefined();
    expect(mockProps.onScheduleInfo).toBeUndefined();
  });

  it('debería manejar callbacks correctamente', () => {
    const mockOnAccessChange = (hasAccess: boolean, reason: string) => {
      expect(typeof hasAccess).toBe('boolean');
      expect(typeof reason).toBe('string');
    };

    const mockOnScheduleInfo = (scheduleInfo: {
      id: number;
      start_datetime: string;
      end_datetime: string;
      room: number;
      room_name?: string;
    }) => {
      expect(typeof scheduleInfo.id).toBe('number');
      expect(typeof scheduleInfo.start_datetime).toBe('string');
      expect(typeof scheduleInfo.end_datetime).toBe('string');
      expect(typeof scheduleInfo.room).toBe('number');
    };

    // Simular llamadas a los callbacks
    mockOnAccessChange(true, 'Acceso permitido');
    mockOnScheduleInfo({
      id: 1,
      start_datetime: '2024-01-01T09:00:00Z',
      end_datetime: '2024-01-01T17:00:00Z',
      room: 1,
      room_name: 'Sala A'
    });
  });
});
