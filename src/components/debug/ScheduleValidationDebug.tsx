import React, { useState } from 'react';

const ScheduleValidationDebug: React.FC = () => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [validationResult, setValidationResult] = useState<{
    valid: boolean;
    message: string;
    details?: unknown;
  } | null>(null);

  const validateDates = () => {
    if (!startDate || !endDate) {
      setValidationResult({
        valid: false,
        message: 'Por favor, selecciona ambas fechas'
      });
      return;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      setValidationResult({
        valid: false,
        message: 'Fechas inválidas'
      });
      return;
    }

    if (end <= start) {
      setValidationResult({
        valid: false,
        message: 'La fecha de fin debe ser posterior a la fecha de inicio',
        details: {
          startDate: start.toLocaleString(),
          endDate: end.toLocaleString(),
          difference: end.getTime() - start.getTime(),
          hours: (end.getTime() - start.getTime()) / (1000 * 60 * 60)
        }
      });
      return;
    }

    const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    if (hours > 12) {
      setValidationResult({
        valid: false,
        message: 'Un turno no puede exceder 12 horas de duración',
        details: {
          startDate: start.toLocaleString(),
          endDate: end.toLocaleString(),
          difference: end.getTime() - start.getTime(),
          hours: hours
        }
      });
      return;
    }

    setValidationResult({
      valid: true,
      message: 'Fechas válidas',
      details: {
        startDate: start.toLocaleString(),
        endDate: end.toLocaleString(),
        difference: end.getTime() - start.getTime(),
        hours: (end.getTime() - start.getTime()) / (1000 * 60 * 60)
      }
    });
  };

  const getStatusColor = (valid: boolean) => {
    return valid ? '#28a745' : '#dc3545';
  };

  const getStatusIcon = (valid: boolean) => {
    return valid ? '✅' : '❌';
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h2>📅 Validador de Fechas para Turnos</h2>
      
      <div style={{ marginBottom: '20px' }}>
        <h3>🔧 Configuración de Fechas</h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Fecha de Inicio:
            </label>
            <input
              type="datetime-local"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #ccc',
                borderRadius: '4px'
              }}
            />
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Fecha de Fin:
            </label>
            <input
              type="datetime-local"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #ccc',
                borderRadius: '4px'
              }}
            />
          </div>
        </div>
        
        <button
          onClick={validateDates}
          style={{
            padding: '10px 20px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            fontSize: '16px'
          }}
        >
          🔍 Validar Fechas
        </button>
      </div>

      {validationResult && (
        <div style={{ 
          padding: '15px', 
          backgroundColor: validationResult.valid ? '#d4edda' : '#f8d7da',
          borderRadius: '5px',
          border: `1px solid ${validationResult.valid ? '#c3e6cb' : '#f5c6cb'}`,
          marginBottom: '20px'
        }}>
          <h4 style={{ 
            color: getStatusColor(validationResult.valid),
            margin: '0 0 10px 0'
          }}>
            {getStatusIcon(validationResult.valid)} {validationResult.message}
          </h4>
          
          {validationResult.details && typeof validationResult.details === 'object' ? (
            <div style={{ fontSize: '14px' }}>
              <p><strong>Fecha de Inicio:</strong> {String((validationResult.details as Record<string, unknown>)?.startDate || '')}</p>
              <p><strong>Fecha de Fin:</strong> {String((validationResult.details as Record<string, unknown>)?.endDate || '')}</p>
              <p><strong>Diferencia:</strong> {(validationResult.details as Record<string, unknown>)?.hours ? Number((validationResult.details as Record<string, unknown>).hours).toFixed(2) : '0.00'} horas</p>
            </div>
          ) : null}
        </div>
      )}

      <div style={{ 
        padding: '15px', 
        backgroundColor: '#e7f3ff', 
        borderRadius: '5px',
        border: '1px solid #b3d9ff'
      }}>
        <h3>📋 Reglas de Validación</h3>
        <ul style={{ margin: '10px 0', paddingLeft: '20px' }}>
          <li><strong>Fecha de inicio:</strong> Debe ser una fecha y hora válida</li>
          <li><strong>Fecha de fin:</strong> Debe ser posterior a la fecha de inicio</li>
          <li><strong>Duración máxima:</strong> No puede exceder 12 horas</li>
          <li><strong>Duración mínima:</strong> Recomendado al menos 1 hora</li>
          <li><strong>Formato:</strong> YYYY-MM-DDTHH:MM (datetime-local)</li>
        </ul>
      </div>

      <div style={{ 
        padding: '15px', 
        backgroundColor: '#fff3cd', 
        borderRadius: '5px',
        border: '1px solid #ffeaa7',
        marginTop: '20px'
      }}>
        <h3>💡 Consejos para Evitar Errores</h3>
        <ul style={{ margin: '10px 0', paddingLeft: '20px' }}>
          <li>Selecciona primero la fecha de inicio</li>
          <li>Luego selecciona la fecha de fin (debe ser posterior)</li>
          <li>Verifica que la duración sea entre 1 y 12 horas</li>
          <li>Usa el validador antes de crear el turno</li>
          <li>Para turnos largos, considera dividirlos en múltiples turnos</li>
        </ul>
      </div>
    </div>
  );
};

export default ScheduleValidationDebug;
