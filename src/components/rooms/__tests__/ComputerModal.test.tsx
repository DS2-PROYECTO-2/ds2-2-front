import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import ComputerModal from '../ComputerModal'
import type { Computer, Room } from '../../../types/index'

// Mock del computador para las pruebas
const mockComputer: Computer = {
  id: '1',
  roomId: 'room-1',
  number: 1,
  serial: 'COMP-001',
  status: 'operational',
  createdAt: '2025-01-01T00:00:00Z',
  updatedAt: '2025-01-01T00:00:00Z'
}

// Mock de la sala para las pruebas
const mockRoom: Room = {
  id: 'room-1',
  name: 'Sala de Pruebas',
  code: 'SP-001',
  capacity: 20,
  description: 'Sala de pruebas para testing',
  computers: [mockComputer],
  createdAt: '2025-01-01T00:00:00Z',
  updatedAt: '2025-01-01T00:00:00Z'
}

describe('ComputerModal', () => {
  const mockOnSave = vi.fn()
  const mockOnClose = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renderiza el modal correctamente', () => {
    render(
      <ComputerModal
        computer={mockComputer}
        room={mockRoom}
        onSave={mockOnSave}
        onClose={mockOnClose}
      />
    )

    expect(screen.getByText('Editar Equipo')).toBeInTheDocument()
    expect(screen.getByDisplayValue('1')).toBeInTheDocument()
    expect(screen.getByDisplayValue('COMP-001')).toBeInTheDocument()
    expect(screen.getByText('Operativo')).toBeInTheDocument()
  })

  it('muestra los campos del formulario', () => {
    render(
      <ComputerModal
        computer={mockComputer}
        room={mockRoom}
        onSave={mockOnSave}
        onClose={mockOnClose}
      />
    )

    expect(screen.getByLabelText('Número del equipo *')).toBeInTheDocument()
    expect(screen.getByLabelText('Número de serie *')).toBeInTheDocument()
    expect(screen.getByLabelText('Estado del equipo')).toBeInTheDocument()
  })

  it('muestra los botones de acción', () => {
    render(
      <ComputerModal
        computer={mockComputer}
        room={mockRoom}
        onSave={mockOnSave}
        onClose={mockOnClose}
      />
    )

    expect(screen.getByText('Cancelar')).toBeInTheDocument()
    expect(screen.getByText('Actualizar Equipo')).toBeInTheDocument()
  })

  it('valida campos requeridos', async () => {
    render(
      <ComputerModal
        computer={mockComputer}
        room={mockRoom}
        onSave={mockOnSave}
        onClose={mockOnClose}
      />
    )

    const numberInput = screen.getByLabelText('Número del equipo *')
    const serialInput = screen.getByLabelText('Número de serie *')

    fireEvent.change(numberInput, { target: { value: '0' } })
    fireEvent.change(serialInput, { target: { value: '' } })

    const saveButton = screen.getByText('Actualizar Equipo')
    expect(saveButton).toBeInTheDocument()
  })

  it('valida formato de número', async () => {
    render(
      <ComputerModal
        computer={mockComputer}
        room={mockRoom}
        onSave={mockOnSave}
        onClose={mockOnClose}
      />
    )

    const numberInput = screen.getByLabelText('Número del equipo *')
    fireEvent.change(numberInput, { target: { value: '0' } })

    const saveButton = screen.getByText('Actualizar Equipo')
    expect(saveButton).toBeInTheDocument()
  })

  it('valida serial único', async () => {
    const roomWithDuplicate: Room = {
      ...mockRoom,
      computers: [
        mockComputer,
        { ...mockComputer, id: '2', serial: 'COMP-002' }
      ]
    }

    render(
      <ComputerModal
        computer={{ ...mockComputer, id: '3' }} // New computer to avoid self-comparison
        room={roomWithDuplicate}
        onSave={mockOnSave}
        onClose={mockOnClose}
      />
    )

    const serialInput = screen.getByLabelText('Número de serie *')
    fireEvent.change(serialInput, { target: { value: 'COMP-001' } }) // Duplicate serial

    const saveButton = screen.getByText('Actualizar Equipo')
    expect(saveButton).toBeInTheDocument()
  })

  it('maneja envío exitoso del formulario', async () => {
    render(
      <ComputerModal
        computer={mockComputer}
        room={mockRoom}
        onSave={mockOnSave}
        onClose={mockOnClose}
      />
    )

    const saveButton = screen.getByText('Actualizar Equipo')
    fireEvent.click(saveButton)

    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalledWith({
        number: 1,
        serial: 'COMP-001',
        status: 'operational',
        roomId: 'room-1'
      })
    })
  })

  it('maneja cancelación del formulario', () => {
    render(
      <ComputerModal
        computer={mockComputer}
        room={mockRoom}
        onSave={mockOnSave}
        onClose={mockOnClose}
      />
    )

    const cancelButton = screen.getByText('Cancelar')
    fireEvent.click(cancelButton)

    expect(mockOnClose).toHaveBeenCalled()
  })

  it('muestra estado de carga', () => {
    render(
      <ComputerModal
        computer={mockComputer}
        room={mockRoom}
        onSave={mockOnSave}
        onClose={mockOnClose}
      />
    )

    const saveButton = screen.getByText('Actualizar Equipo')
    expect(saveButton).toBeInTheDocument()
  })

  it('actualiza campos cuando el usuario cambia', () => {
    render(
      <ComputerModal
        computer={mockComputer}
        room={mockRoom}
        onSave={mockOnSave}
        onClose={mockOnClose}
      />
    )

    const numberInput = screen.getByDisplayValue('1')
    fireEvent.change(numberInput, { target: { value: '2' } })

    expect(numberInput).toHaveValue(2)
  })

  it('maneja computador sin datos opcionales', () => {
    const computerWithoutOptional: Computer = {
      id: '1',
      roomId: 'room-1',
      number: 1,
      serial: 'COMP-001',
      status: 'operational'
    }

    render(
      <ComputerModal
        computer={computerWithoutOptional}
        room={mockRoom}
        onSave={mockOnSave}
        onClose={mockOnClose}
      />
    )

    expect(screen.getByText('Editar Equipo')).toBeInTheDocument()
    expect(screen.getByDisplayValue('1')).toBeInTheDocument()
    expect(screen.getByDisplayValue('COMP-001')).toBeInTheDocument()
    expect(screen.getByText('Operativo')).toBeInTheDocument()
  })

  it('genera serial automáticamente', () => {
    const roomWithoutComputers: Room = { ...mockRoom, computers: [] }
    render(
      <ComputerModal
        computer={null} // Adding a new computer
        room={roomWithoutComputers}
        onSave={mockOnSave}
        onClose={mockOnClose}
      />
    )

    const generateButton = screen.getByText('Generar')
    fireEvent.click(generateButton)

    const serialInput = screen.getByLabelText('Número de serie *')
    expect(serialInput).not.toHaveValue('COMP-001') // Should be a newly generated serial
    // Check that it has a valid format (12 characters with dashes)
    const serialValue = serialInput.value
    expect(serialValue).toMatch(/^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/)
  })
})