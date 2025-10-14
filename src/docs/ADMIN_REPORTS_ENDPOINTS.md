# Endpoints Utilizados para Reportes de Administradores

## Resumen

Cuando un **administrador** accede a la sección de reportes, se utilizan los siguientes endpoints del backend para obtener todos los datos del sistema.

## Endpoints Principales

### 1. **Estadísticas Generales** (Cards de Estadísticas)
```
GET /api/rooms/reports/stats/?from_date=2024-01-01&to_date=2024-01-31&user_id=123&room_id=456
```

**Parámetros:**
- `from_date`: Fecha de inicio (YYYY-MM-DD)
- `to_date`: Fecha de fin (YYYY-MM-DD)
- `user_id`: ID del monitor específico (opcional)
- `room_id`: ID de la sala específica (opcional)

**Respuesta:**
```json
{
  "late_arrivals_count": 5,
  "total_assigned_hours": 120.5,
  "total_worked_hours": 115.2,
  "remaining_hours": 5.3
}
```

### 2. **Horas Trabajadas con Superposición** (Gráficos)
```
GET /api/rooms/reports/worked-hours/?from_date=2024-01-01&to_date=2024-01-31&user_id=123&room_id=456
```

**Parámetros:**
- `from_date`: Fecha de inicio (YYYY-MM-DD)
- `to_date`: Fecha de fin (YYYY-MM-DD)
- `user_id`: ID del monitor específico (opcional)
- `room_id`: ID de la sala específica (opcional)

**Respuesta:**
```json
{
  "total_worked_hours": 115.2,
  "total_assigned_hours": 120.5,
  "compliance_percentage": 95.6,
  "overlaps_found": [
    {
      "entry_id": 123,
      "schedule_id": 456,
      "user": "monitor1",
      "overlap_hours": 2.5,
      "entry_period": "2024-01-15 08:00 - 2024-01-15 16:00",
      "schedule_period": "2024-01-15 09:00 - 2024-01-15 17:00"
    }
  ],
  "user_hours": {
    "123": 40.5,
    "456": 35.2
  },
  "schedule_hours": {
    "789": 8.0,
    "790": 6.5
  }
}
```

### 3. **Schedules (Turnos)** (Gráficos)
```
GET /api/schedule/schedules/?date_from=2024-01-01&date_to=2024-01-31&user=123&room=456
```

**Parámetros:**
- `date_from`: Fecha de inicio (YYYY-MM-DD)
- `date_to`: Fecha de fin (YYYY-MM-DD)
- `user`: ID del monitor específico (opcional)
- `room`: ID de la sala específica (opcional)
- `status`: Estado del turno (opcional)

**Respuesta:**
```json
{
  "results": [
    {
      "id": 123,
      "start_time": "2024-01-15T08:00:00Z",
      "end_time": "2024-01-15T16:00:00Z",
      "user": 456,
      "room": 789,
      "status": "completed"
    }
  ]
}
```

### 4. **Entries (Entradas/Salidas)** (Gráficos)
```
GET /api/rooms/entries/?from=2024-01-01&to=2024-01-31&user_name=monitor1&room=456&page_size=10000
```

**Parámetros:**
- `from`: Fecha de inicio (YYYY-MM-DD)
- `to`: Fecha de fin (YYYY-MM-DD)
- `user_name`: Nombre de usuario del monitor (opcional)
- `room`: ID de la sala específica (opcional)
- `active`: Solo entradas activas (opcional)
- `document`: Número de documento (opcional)
- `page_size`: Tamaño de página (10000 para obtener todos)

**Respuesta:**
```json
{
  "entries": [
    {
      "id": 123,
      "entry_time": "2024-01-15T08:00:00Z",
      "exit_time": "2024-01-15T16:00:00Z",
      "user": 456,
      "room": 789,
      "room_name": "Sala A"
    }
  ]
}
```

## Endpoints Adicionales para Filtros

### 5. **Salas Disponibles** (Filtro de Sala)
```
GET /api/rooms/
```

**Respuesta:**
```json
[
  {
    "id": 1,
    "name": "Sala A",
    "code": "SA001",
    "capacity": 30
  }
]
```

### 6. **Monitores Disponibles** (Filtro de Monitor)
```
GET /api/users/?role=monitor
```

**Respuesta:**
```json
[
  {
    "id": 123,
    "username": "monitor1",
    "full_name": "Juan Pérez",
    "role": "monitor",
    "is_active": true,
    "is_verified": true
  }
]
```

## Flujo de Carga de Datos para Administradores

### 1. **Carga Inicial**
```typescript
// Se ejecutan en paralelo
const [statsData, workedHoursData, schedulesData, entriesData] = await Promise.all([
  // 1. Estadísticas para las cards
  apiClient.get(`/api/rooms/reports/stats/?${params.toString()}`),
  
  // 2. Horas trabajadas para gráficos
  apiClient.get(`/api/rooms/reports/worked-hours/?${params.toString()}`),
  
  // 3. Schedules para gráficos
  scheduleService.getSchedules({
    date_from: dateFrom,
    date_to: dateTo,
    room: selectedRoom || undefined,
    user: selectedMonitor || undefined
  }),
  
  // 4. Entries para gráficos
  getAllEntriesUnpaginated({
    from: dateFrom,
    to: dateTo,
    room: selectedRoom || undefined,
    user_name: selectedMonitor ? monitors.find(m => m.id === selectedMonitor)?.username : undefined
  })
]);
```

### 2. **Aplicación de Filtros**
- **Por fecha**: Se aplica a todos los endpoints
- **Por monitor**: Se filtra en schedules y entries
- **Por sala**: Se filtra en todos los endpoints
- **Por período**: Se calculan fechas automáticamente

### 3. **Procesamiento de Datos**
- **Cards**: Se usan datos directos de `/api/rooms/reports/stats/`
- **Gráfico 1**: Entradas y salidas por día (desde entries)
- **Gráfico 2**: Horas por día (desde worked-hours)
- **Gráfico 3**: Distribución por sala (desde worked-hours)

## Diferencias con Monitores

| Aspecto | Administradores | Monitores |
|---------|------------------|-----------|
| **Endpoints** | `/api/rooms/reports/stats/` | `/api/rooms/reports/monitor-stats/` |
| **Filtros** | Todos los monitores | Solo sus datos |
| **Datos** | Sistema completo | Datos personales |
| **Permisos** | Acceso total | Acceso limitado |
| **Fallback** | No necesario | Cálculo local |

## Requisitos del Backend

Para que funcionen correctamente, el backend debe implementar:

### ✅ **Endpoints Obligatorios**
1. `/api/rooms/reports/stats/` - Estadísticas generales
2. `/api/rooms/reports/worked-hours/` - Horas trabajadas con superposición
3. `/api/schedule/schedules/` - Turnos con filtros
4. `/api/rooms/entries/` - Entradas con filtros

### ✅ **Filtros Soportados**
- Filtrado por fecha (`from_date`, `to_date`)
- Filtrado por usuario (`user_id`, `user`)
- Filtrado por sala (`room_id`, `room`)
- Paginación (`page_size`)

### ✅ **Respuestas Estructuradas**
- Formato JSON consistente
- Campos requeridos presentes
- Manejo de errores apropiado

## Beneficios de esta Arquitectura

1. **✅ Datos completos**: Los administradores ven todos los datos del sistema
2. **✅ Filtros avanzados**: Pueden filtrar por cualquier criterio
3. **✅ Rendimiento**: Endpoints optimizados para grandes volúmenes
4. **✅ Flexibilidad**: Fácil agregar nuevos filtros o métricas
5. **✅ Escalabilidad**: Soporta múltiples usuarios simultáneos

Esta arquitectura garantiza que los administradores tengan acceso completo a todos los datos del sistema con la máxima flexibilidad y rendimiento.
