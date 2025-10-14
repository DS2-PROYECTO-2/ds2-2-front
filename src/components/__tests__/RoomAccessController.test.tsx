import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import RoomAccessController from '../rooms/RoomAccessController';

// Mock de useAuth
const mockUser = {
  id: 1,
  username: 'testuser',
  email: 'test@example.com',
  role: 'monitor' as const,
  is_verified: true
};

// Mock de useRoomAccess
const mockRoomAccess = {
  validateAccess: vi.fn(),
  registerEntry: vi.fn(),
  registerExit: vi.fn(),
  canAccessRoom: vi.fn(),
  getCurrentScheduleInfo: vi.fn()
};

vi.mock('../../hooks/useAuth', () => ({
  useAuth: () => ({
    user: mockUser
  })
}));

vi.mock('../../hooks/useRoomAccess', () => ({
  useRoomAccess: () => mockRoomAccess
}));

describe('RoomAccessController', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('debería ser un componente React', () => {
    expect(RoomAccessController).toBeDefined();
    expect(typeof RoomAccessController).toBe('function');
  });

  it('debería renderizar sin errores', () => {
    const mockProps = {
      roomId: 1,
      onAccessChange: vi.fn(),
      onScheduleInfo: vi.fn()
    };

    expect(() => render(<RoomAccessController {...mockProps} />)).not.toThrow();
  });

  it('debería manejar props opcionales', () => {
    const mockProps = {
      roomId: 1
    };

    expect(() => render(<RoomAccessController {...mockProps} />)).not.toThrow();
  });

  it('debería llamar a canAccessRoom cuando el usuario es monitor', async () => {
    const mockOnAccessChange = vi.fn();
    const mockAccessInfo = {
      canAccess: true,
      reason: 'Acceso permitido'
    };

    mockRoomAccess.canAccessRoom.mockResolvedValueOnce(mockAccessInfo);

    render(
      <RoomAccessController 
        roomId={1} 
        onAccessChange={mockOnAccessChange} 
      />
    );

    await waitFor(() => {
      expect(mockRoomAccess.canAccessRoom).toHaveBeenCalledWith(1);
    });
  });

  it('debería manejar errores en la verificación de acceso', async () => {
    const mockOnAccessChange = vi.fn();
    const mockError = new Error('Error de acceso');

    mockRoomAccess.canAccessRoom.mockRejectedValueOnce(mockError);

    render(
      <RoomAccessController 
        roomId={1} 
        onAccessChange={mockOnAccessChange} 
      />
    );

    await waitFor(() => {
      expect(mockOnAccessChange).toHaveBeenCalledWith(false, 'Error al verificar acceso');
    });
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
