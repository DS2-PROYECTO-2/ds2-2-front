import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useSecurity } from '../useSecurity'

// Mock de useAuth
const mockUseAuth = vi.fn(() => ({
  user: { 
    id: 1, 
    username: 'admin', 
    email: 'admin@test.com', 
    role: 'admin', 
    is_verified: true 
  },
  isAuthenticated: true
}))

vi.mock('../useAuth', () => ({
  useAuth: mockUseAuth
}))

describe('useSecurity - New Features', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('retorna permisos de administrador correctamente', () => {
    const { result } = renderHook(() => useSecurity())

    expect(result.current.isAdmin).toBe(true)
    expect(result.current.canEdit()).toBe(true)
    expect(result.current.canDelete()).toBe(true)
    expect(result.current.canCreate()).toBe(true)
  })

  it('retorna permisos de monitor correctamente', async () => {
    // Mock useAuth directly
    mockUseAuth.mockReturnValue({
      user: { 
        id: 2, 
        username: 'monitor', 
        email: 'monitor@test.com', 
        role: 'monitor', 
        is_verified: true 
      },
      isAuthenticated: true
    })

    const { result } = renderHook(() => useSecurity())

    expect(result.current.isAdmin).toBe(false)
    expect(result.current.canEdit()).toBe(false)
    expect(result.current.canDelete()).toBe(false)
    expect(result.current.canCreate()).toBe(false)
  })

  it('maneja usuario no autenticado', async () => {
    mockUseAuth.mockReturnValue({
      user: null,
      isAuthenticated: false
    })

    const { result } = renderHook(() => useSecurity())

    expect(result.current.isAdmin).toBe(false)
    expect(result.current.canEdit()).toBe(false)
    expect(result.current.canDelete()).toBe(false)
    expect(result.current.canCreate()).toBe(false)
  })

  it('maneja usuario sin rol definido', async () => {
    mockUseAuth.mockReturnValue({
      user: { 
        id: 3, 
        username: 'user', 
        email: 'user@test.com', 
        role: null, 
        is_verified: true 
      },
      isAuthenticated: true
    })

    const { result } = renderHook(() => useSecurity())

    expect(result.current.isAdmin).toBe(false)
    expect(result.current.canEdit()).toBe(false)
    expect(result.current.canDelete()).toBe(false)
    expect(result.current.canCreate()).toBe(false)
  })

  it('maneja usuario con rol inválido', async () => {
    mockUseAuth.mockReturnValue({
      user: { 
        id: 4, 
        username: 'user', 
        email: 'user@test.com', 
        role: 'invalid_role', 
        is_verified: true 
      },
      isAuthenticated: true
    })

    const { result } = renderHook(() => useSecurity())

    expect(result.current.isAdmin).toBe(false)
    expect(result.current.canEdit()).toBe(false)
    expect(result.current.canDelete()).toBe(false)
    expect(result.current.canCreate()).toBe(false)
  })

  it('verifica permisos de edición correctamente', () => {
    const { result } = renderHook(() => useSecurity())

    // Admin puede editar
    expect(result.current.canEdit()).toBe(true)
    
    // Verificar que la función es consistente
    expect(result.current.canEdit()).toBe(result.current.canEdit())
  })

  it('verifica permisos de eliminación correctamente', () => {
    const { result } = renderHook(() => useSecurity())

    // Admin puede eliminar
    expect(result.current.canDelete()).toBe(true)
    
    // Verificar que la función es consistente
    expect(result.current.canDelete()).toBe(result.current.canDelete())
  })

  it('verifica permisos de creación correctamente', () => {
    const { result } = renderHook(() => useSecurity())

    // Admin puede crear
    expect(result.current.canCreate()).toBe(true)
    
    // Verificar que la función es consistente
    expect(result.current.canCreate()).toBe(result.current.canCreate())
  })

  it('maneja cambios de usuario dinámicamente', async () => {
    mockUseAuth.mockReturnValue({
      user: { 
        id: 1, 
        username: 'admin', 
        email: 'admin@test.com', 
        role: 'admin', 
        is_verified: true 
      },
      isAuthenticated: true
    })

    const { result, rerender } = renderHook(() => useSecurity())

    expect(result.current.isAdmin).toBe(true)
    expect(result.current.canEdit()).toBe(true)

    // Cambiar a monitor
    mockUseAuth.mockReturnValue({
      user: { 
        id: 2, 
        username: 'monitor', 
        email: 'monitor@test.com', 
        role: 'monitor', 
        is_verified: true 
      },
      isAuthenticated: true
    })

    rerender()

    expect(result.current.isAdmin).toBe(false)
    expect(result.current.canEdit()).toBe(false)
  })

  it('maneja usuario no verificado', async () => {
    mockUseAuth.mockReturnValue({
      user: { 
        id: 1, 
        username: 'admin', 
        email: 'admin@test.com', 
        role: 'admin', 
        is_verified: false 
      },
      isAuthenticated: true
    })

    const { result } = renderHook(() => useSecurity())

    // Aunque sea admin, si no está verificado, no debería tener permisos
    expect(result.current.isAdmin).toBe(false)
    expect(result.current.canEdit()).toBe(false)
    expect(result.current.canDelete()).toBe(false)
    expect(result.current.canCreate()).toBe(false)
  })
})

