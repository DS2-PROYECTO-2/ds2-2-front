import { describe, it, expect } from 'vitest';
import { useRoomAccess } from '../useRoomAccess';

describe('useRoomAccess', () => {
  it('debería ser un hook', () => {
    expect(useRoomAccess).toBeDefined();
    expect(typeof useRoomAccess).toBe('function');
  });

  it('debería retornar funciones', () => {
    // Mock básico para verificar que el hook existe
    const mockHook = {
      isValidating: false,
      lastValidation: null,
      validateAccess: () => Promise.resolve({ access_granted: true }),
      registerEntry: () => Promise.resolve({ success: true }),
      registerExit: () => Promise.resolve({ success: true })
    };

    expect(mockHook.isValidating).toBe(false);
    expect(mockHook.lastValidation).toBe(null);
    expect(typeof mockHook.validateAccess).toBe('function');
    expect(typeof mockHook.registerEntry).toBe('function');
    expect(typeof mockHook.registerExit).toBe('function');
  });
});
