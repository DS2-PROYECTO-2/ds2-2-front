import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import ProfileEditForm from '../ProfileEditForm'
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

describe('ProfileEditForm', () => {
  const mockOnSave = vi.fn()
  const mockOnCancel = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renderiza el formulario correctamente', () => {
    render(
      <ProfileEditForm
        user={mockUser}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
        isLoading={false}
      />
    )

    expect(screen.getByDisplayValue('Test')).toBeInTheDocument()
    expect(screen.getByDisplayValue('User')).toBeInTheDocument()
    expect(screen.getByDisplayValue('testuser')).toBeInTheDocument()
    expect(screen.getByDisplayValue('test@example.com')).toBeInTheDocument()
    expect(screen.getByDisplayValue('1234567890')).toBeInTheDocument()
    expect(screen.getByDisplayValue('12345678')).toBeInTheDocument()
  })

  it('muestra los campos requeridos', () => {
    render(
      <ProfileEditForm
        user={mockUser}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
        isLoading={false}
      />
    )

    expect(screen.getByLabelText('Nombre *')).toBeInTheDocument()
    expect(screen.getByLabelText('Apellido *')).toBeInTheDocument()
    expect(screen.getByLabelText('Nombre de Usuario *')).toBeInTheDocument()
    expect(screen.getByLabelText('Correo Electrónico *')).toBeInTheDocument()
    expect(screen.getByLabelText('Teléfono')).toBeInTheDocument()
    expect(screen.getByLabelText('Identificación')).toBeInTheDocument()
  })

  it('muestra los botones de acción', () => {
    render(
      <ProfileEditForm
        user={mockUser}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
        isLoading={false}
      />
    )

    expect(screen.getByText('Guardar Cambios')).toBeInTheDocument()
    expect(screen.getByText('Cancelar')).toBeInTheDocument()
  })

  it('valida campos requeridos', async () => {
    render(
      <ProfileEditForm
        user={mockUser}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
        isLoading={false}
      />
    )

    // Limpiar campos requeridos
    const firstNameInput = screen.getByDisplayValue('Test')
    const lastNameInput = screen.getByDisplayValue('User')
    const usernameInput = screen.getByDisplayValue('testuser')
    const emailInput = screen.getByDisplayValue('test@example.com')

    fireEvent.change(firstNameInput, { target: { value: '' } })
    fireEvent.change(lastNameInput, { target: { value: '' } })
    fireEvent.change(usernameInput, { target: { value: '' } })
    fireEvent.change(emailInput, { target: { value: '' } })

    const saveButton = screen.getByText('Guardar Cambios')
    fireEvent.click(saveButton)

    await waitFor(() => {
      expect(screen.getByText('El nombre es requerido')).toBeInTheDocument()
      expect(screen.getByText('El apellido es requerido')).toBeInTheDocument()
      expect(screen.getByText('El nombre de usuario es requerido')).toBeInTheDocument()
      expect(screen.getByText('El correo electrónico es requerido')).toBeInTheDocument()
    })
  })


  it('valida formato de teléfono', async () => {
    render(
      <ProfileEditForm
        user={mockUser}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
        isLoading={false}
      />
    )

    const phoneInput = screen.getByDisplayValue('1234567890')
    fireEvent.change(phoneInput, { target: { value: 'invalid-phone' } })

    const saveButton = screen.getByText('Guardar Cambios')
    fireEvent.click(saveButton)

    await waitFor(() => {
      expect(screen.getByText('El formato del teléfono no es válido')).toBeInTheDocument()
    })
  })

  it('acepta teléfono válido', async () => {
    render(
      <ProfileEditForm
        user={mockUser}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
        isLoading={false}
      />
    )

    const phoneInput = screen.getByDisplayValue('1234567890')
    fireEvent.change(phoneInput, { target: { value: '+1-234-567-8900' } })

    const saveButton = screen.getByText('Guardar Cambios')
    fireEvent.click(saveButton)

    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalledWith({
        first_name: 'Test',
        last_name: 'User',
        username: 'testuser',
        email: 'test@example.com',
        phone: '+1-234-567-8900',
        identification: '12345678'
      })
    })
  })

  it('maneja envío exitoso del formulario', async () => {
    render(
      <ProfileEditForm
        user={mockUser}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
        isLoading={false}
      />
    )

    const saveButton = screen.getByText('Guardar Cambios')
    fireEvent.click(saveButton)

    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalledWith({
        first_name: 'Test',
        last_name: 'User',
        username: 'testuser',
        email: 'test@example.com',
        phone: '1234567890',
        identification: '12345678'
      })
    })
  })

  it('maneja cancelación del formulario', () => {
    render(
      <ProfileEditForm
        user={mockUser}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
        isLoading={false}
      />
    )

    const cancelButton = screen.getByText('Cancelar')
    fireEvent.click(cancelButton)

    expect(mockOnCancel).toHaveBeenCalled()
  })

  it('muestra estado de carga', () => {
    render(
      <ProfileEditForm
        user={mockUser}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
        isLoading={true}
      />
    )

    const saveButton = screen.getByText('Guardando...')
    expect(saveButton).toBeInTheDocument()
    expect(saveButton).toBeDisabled()
  })

  it('actualiza campos cuando el usuario cambia', () => {
    render(
      <ProfileEditForm
        user={mockUser}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
        isLoading={false}
      />
    )

    const firstNameInput = screen.getByDisplayValue('Test')
    fireEvent.change(firstNameInput, { target: { value: 'Nuevo Nombre' } })

    expect(firstNameInput).toHaveValue('Nuevo Nombre')
  })

  it('maneja usuario sin datos opcionales', () => {
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
      <ProfileEditForm
        user={userWithoutOptional}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
        isLoading={false}
      />
    )

    expect(screen.getByDisplayValue('Test')).toBeInTheDocument()
    expect(screen.getByDisplayValue('User')).toBeInTheDocument()
    expect(screen.getByDisplayValue('testuser')).toBeInTheDocument()
    expect(screen.getByDisplayValue('test@example.com')).toBeInTheDocument()
  })
})
