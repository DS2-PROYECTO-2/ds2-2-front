import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import ScheduleValidationDebug from '../ScheduleValidationDebug'

describe('ScheduleValidationDebug', () => {
  it('renderiza el componente correctamente', () => {
    render(<ScheduleValidationDebug />)
    
    expect(screen.getByText('📅 Validador de Fechas para Turnos')).toBeInTheDocument()
    expect(screen.getByText('🔧 Configuración de Fechas')).toBeInTheDocument()
    expect(screen.getByText('🔍 Validar Fechas')).toBeInTheDocument()
  })

  it('muestra los campos de fecha de inicio y fin', () => {
    render(<ScheduleValidationDebug />)
    
    const inputs = screen.getAllByDisplayValue('')
    expect(inputs).toHaveLength(2)
    expect(inputs[0]).toHaveAttribute('type', 'datetime-local')
    expect(inputs[1]).toHaveAttribute('type', 'datetime-local')
  })

  it('muestra las reglas de validación', () => {
    render(<ScheduleValidationDebug />)
    
    expect(screen.getByText('📋 Reglas de Validación')).toBeInTheDocument()
    expect(screen.getByText('💡 Consejos para Evitar Errores')).toBeInTheDocument()
  })

  it('valida fechas cuando ambas están vacías', async () => {
    render(<ScheduleValidationDebug />)
    
    const validateButton = screen.getByText('🔍 Validar Fechas')
    fireEvent.click(validateButton)
    
    await waitFor(() => {
      expect(screen.getByText('❌ Por favor, selecciona ambas fechas')).toBeInTheDocument()
    })
  })

  it('valida fechas cuando solo una está seleccionada', async () => {
    render(<ScheduleValidationDebug />)
    
    const inputs = screen.getAllByDisplayValue('')
    fireEvent.change(inputs[0], { target: { value: '2025-01-15T10:00' } })
    
    const validateButton = screen.getByText('🔍 Validar Fechas')
    fireEvent.click(validateButton)
    
    await waitFor(() => {
      expect(screen.getByText('❌ Por favor, selecciona ambas fechas')).toBeInTheDocument()
    })
  })

  it('valida fechas válidas correctamente', async () => {
    render(<ScheduleValidationDebug />)
    
    const inputs = screen.getAllByDisplayValue('')
    const startDateInput = inputs[0]
    const endDateInput = inputs[1]
    
    fireEvent.change(startDateInput, { target: { value: '2025-01-15T10:00' } })
    fireEvent.change(endDateInput, { target: { value: '2025-01-15T12:00' } })
    
    const validateButton = screen.getByText('🔍 Validar Fechas')
    fireEvent.click(validateButton)
    
    await waitFor(() => {
      expect(screen.getByText('✅ Fechas válidas')).toBeInTheDocument()
    })
  })

  it('valida cuando la fecha de fin es anterior a la de inicio', async () => {
    render(<ScheduleValidationDebug />)
    
    const inputs = screen.getAllByDisplayValue('')
    const startDateInput = inputs[0]
    const endDateInput = inputs[1]
    
    fireEvent.change(startDateInput, { target: { value: '2025-01-15T12:00' } })
    fireEvent.change(endDateInput, { target: { value: '2025-01-15T10:00' } })
    
    const validateButton = screen.getByText('🔍 Validar Fechas')
    fireEvent.click(validateButton)
    
    await waitFor(() => {
      expect(screen.getByText('❌ La fecha de fin debe ser posterior a la fecha de inicio')).toBeInTheDocument()
    })
  })

  it('valida cuando el turno excede 12 horas', async () => {
    render(<ScheduleValidationDebug />)
    
    const inputs = screen.getAllByDisplayValue('')
    const startDateInput = inputs[0]
    const endDateInput = inputs[1]
    
    fireEvent.change(startDateInput, { target: { value: '2025-01-15T08:00' } })
    fireEvent.change(endDateInput, { target: { value: '2025-01-15T22:00' } })
    
    const validateButton = screen.getByText('🔍 Validar Fechas')
    fireEvent.click(validateButton)
    
    await waitFor(() => {
      expect(screen.getByText('❌ Un turno no puede exceder 12 horas de duración')).toBeInTheDocument()
    })
  })

  it('muestra detalles de la validación cuando es exitosa', async () => {
    render(<ScheduleValidationDebug />)
    
    const inputs = screen.getAllByDisplayValue('')
    const startDateInput = inputs[0]
    const endDateInput = inputs[1]
    
    fireEvent.change(startDateInput, { target: { value: '2025-01-15T10:00' } })
    fireEvent.change(endDateInput, { target: { value: '2025-01-15T12:00' } })
    
    const validateButton = screen.getByText('🔍 Validar Fechas')
    fireEvent.click(validateButton)
    
    await waitFor(() => {
      expect(screen.getByText('✅ Fechas válidas')).toBeInTheDocument()
      expect(screen.getByText(/Diferencia:/)).toBeInTheDocument()
    })
  })

  it('muestra detalles de la validación cuando falla por duración', async () => {
    render(<ScheduleValidationDebug />)
    
    const inputs = screen.getAllByDisplayValue('')
    const startDateInput = inputs[0]
    const endDateInput = inputs[1]
    
    fireEvent.change(startDateInput, { target: { value: '2025-01-15T08:00' } })
    fireEvent.change(endDateInput, { target: { value: '2025-01-15T22:00' } })
    
    const validateButton = screen.getByText('🔍 Validar Fechas')
    fireEvent.click(validateButton)
    
    await waitFor(() => {
      expect(screen.getByText('❌ Un turno no puede exceder 12 horas de duración')).toBeInTheDocument()
      expect(screen.getByText(/Diferencia:/)).toBeInTheDocument()
    })
  })

})
