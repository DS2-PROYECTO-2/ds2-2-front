import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import ProfileEditModal from '../ProfileEditModal'
import type { User } from '../../../context/AuthContext'

// Mock del usuario para las pruebas
const mockUser: User = {
  id: 1,
  username: 'testuser',
  email: 'test@example.com',
  role: 'monitor',
  is_verified: true,
  first_name: 'Test',
  last_name: 'User',
  phone: '1234567890',
  identification: '12345678'
}

describe('ProfileEditModal', () => {
  const mockOnSave = vi.fn()
  const mockOnClose = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renderiza el modal correctamente', () => {
    render(
      <ProfileEditModal
        user={mockUser}
        onSave={mockOnSave}
        onClose={mockOnClose}
        isLoading={false}
      />
    )

    expect(screen.getByText('Editar Perfil')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Test')).toBeInTheDocument()
    expect(screen.getByDisplayValue('User')).toBeInTheDocument()
    expect(screen.getByDisplayValue('testuser')).toBeInTheDocument()
    expect(screen.getByDisplayValue('test@example.com')).toBeInTheDocument()
  })

  it('muestra el botón de cerrar', () => {
    render(
      <ProfileEditModal
        user={mockUser}
        onSave={mockOnSave}
        onClose={mockOnClose}
        isLoading={false}
      />
    )

    const closeButton = screen.getByRole('button', { name: '' })
    expect(closeButton).toBeInTheDocument()
  })

  it('maneja el cierre del modal', () => {
    render(
      <ProfileEditModal
        user={mockUser}
        onSave={mockOnSave}
        onClose={mockOnClose}
        isLoading={false}
      />
    )

    const closeButton = screen.getByRole('button', { name: '' })
    fireEvent.click(closeButton)

    expect(mockOnClose).toHaveBeenCalled()
  })

  it('pasa las props correctas al ProfileEditForm', () => {
    render(
      <ProfileEditModal
        user={mockUser}
        onSave={mockOnSave}
        onClose={mockOnClose}
        isLoading={false}
      />
    )

    // Verificar que el formulario está presente
    expect(screen.getByDisplayValue('Test')).toBeInTheDocument()
    expect(screen.getByDisplayValue('User')).toBeInTheDocument()
    expect(screen.getByDisplayValue('testuser')).toBeInTheDocument()
    expect(screen.getByDisplayValue('test@example.com')).toBeInTheDocument()
  })

  it('pasa el estado de carga al ProfileEditForm', () => {
    render(
      <ProfileEditModal
        user={mockUser}
        onSave={mockOnSave}
        onClose={mockOnClose}
        isLoading={true}
      />
    )

    // Verificar que el botón de guardar muestra el estado de carga
    expect(screen.getByText('Guardando...')).toBeInTheDocument()
  })

  it('maneja el estado de carga cuando no está cargando', () => {
    render(
      <ProfileEditModal
        user={mockUser}
        onSave={mockOnSave}
        onClose={mockOnClose}
        isLoading={false}
      />
    )

    // Verificar que el botón de guardar no muestra el estado de carga
    expect(screen.getByText('Guardar Cambios')).toBeInTheDocument()
  })

  it('renderiza con usuario sin datos opcionales', () => {
    const userWithoutOptional: User = {
      id: 1,
      username: 'testuser',
      email: 'test@example.com',
      role: 'monitor',
      is_verified: true,
      first_name: 'Test',
      last_name: 'User'
    }

    render(
      <ProfileEditModal
        user={userWithoutOptional}
        onSave={mockOnSave}
        onClose={mockOnClose}
        isLoading={false}
      />
    )

    expect(screen.getByText('Editar Perfil')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Test')).toBeInTheDocument()
    expect(screen.getByDisplayValue('User')).toBeInTheDocument()
    expect(screen.getByDisplayValue('testuser')).toBeInTheDocument()
    expect(screen.getByDisplayValue('test@example.com')).toBeInTheDocument()
  })

  it('tiene la estructura correcta del modal', () => {
    render(
      <ProfileEditModal
        user={mockUser}
        onSave={mockOnSave}
        onClose={mockOnClose}
        isLoading={false}
      />
    )

    // Verificar que tiene la estructura del modal
    expect(screen.getByText('Editar Perfil')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Test')).toBeInTheDocument()
  })
})
