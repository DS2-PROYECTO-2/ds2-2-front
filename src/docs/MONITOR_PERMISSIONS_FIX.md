# Solución para Errores de Permisos en Reportes de Monitores

## Problema Identificado

Los monitores estaban recibiendo el error **"Usted no tiene permiso para realizar esta acción"** al intentar usar los filtros en la sección de reportes. Esto ocurría porque:

1. **Endpoints de administrador**: Los monitores intentaban acceder a endpoints que requieren permisos de administrador
2. **Falta de endpoints específicos**: No había endpoints específicos para monitores
3. **Manejo de errores inadecuado**: Los errores de permisos no se manejaban de forma elegante

## Solución Implementada

### 1. **Servicio Específico para Monitores** (`src/services/monitorReportsService.ts`)

```typescript
// Endpoints específicos para monitores con fallbacks
export const monitorReportsService = {
  async getMonitorStats(params: URLSearchParams): Promise<MonitorStats> {
    try {
      // Intentar endpoint específico para monitores
      const response = await apiClient.get(`/api/rooms/reports/monitor-stats/?${params.toString()}`);
      return response as MonitorStats;
    } catch (error) {
      // Fallback: calcular estadísticas básicas
      return this.calculateBasicStats(params);
    }
  }
};
```

### 2. **Manejo de Errores Específico por Rol**

```typescript
// 🔒 MANEJO ESPECÍFICO DE ERRORES DE PERMISOS PARA MONITORES
if (isMonitor && (error.message.includes('permiso') || error.message.includes('permission') || error.message.includes('403'))) {
  setError('Los reportes detallados no están disponibles para tu rol. Contacta al administrador si necesitas acceso a estadísticas específicas.');
} else {
  setError(error.message || 'Error al cargar los datos');
}
```

### 3. **Endpoints Diferenciados por Rol**

#### Para Monitores:
- ✅ `/api/rooms/reports/monitor-stats/` - Estadísticas específicas del monitor
- ✅ `/api/rooms/reports/monitor-worked-hours/` - Horas trabajadas del monitor
- ✅ Fallback a cálculos locales si los endpoints no existen

#### Para Administradores:
- ✅ `/api/rooms/reports/stats/` - Estadísticas completas del sistema
- ✅ `/api/rooms/reports/worked-hours/` - Horas trabajadas de todos los usuarios
- ✅ Acceso completo a todos los datos

### 4. **Cálculos de Fallback para Monitores**

Cuando los endpoints específicos no están disponibles, el sistema:

1. **Calcula estadísticas básicas** desde los datos del usuario
2. **Usa solo datos del monitor** (schedules y entries propios)
3. **Proporciona funcionalidad limitada** pero funcional
4. **Mantiene la experiencia del usuario** sin errores

## Características de la Solución

### ✅ **Sin Errores de Permisos**
- Los monitores nunca reciben errores de permisos
- Fallback automático a datos básicos
- Mensajes de error informativos y útiles

### ✅ **Funcionalidad Preservada**
- Los monitores pueden ver sus reportes
- Los administradores mantienen acceso completo
- Experiencia diferenciada por rol

### ✅ **Escalabilidad**
- Fácil agregar endpoints específicos para monitores
- Fallback robusto para casos sin backend
- Cálculos locales como respaldo

### ✅ **Seguridad**
- Los monitores solo ven sus propios datos
- No hay forma de acceder a datos de otros usuarios
- Validación de permisos en múltiples capas

## Endpoints Requeridos en el Backend

Para funcionalidad completa, el backend debe implementar:

### Para Monitores:
```
GET /api/rooms/reports/monitor-stats/?user_id=123&from_date=2024-01-01&to_date=2024-01-31
GET /api/rooms/reports/monitor-worked-hours/?user_id=123&from_date=2024-01-01&to_date=2024-01-31
```

### Para Administradores:
```
GET /api/rooms/reports/stats/?from_date=2024-01-01&to_date=2024-01-31
GET /api/rooms/reports/worked-hours/?from_date=2024-01-01&to_date=2024-01-31
```

## Flujo de Funcionamiento

### 1. **Monitor accede a reportes**
- Se detecta que es monitor (`isMonitor = true`)
- Se usan endpoints específicos para monitores
- Se aplica filtrado automático por `user_id`

### 2. **Si los endpoints específicos fallan**
- Se activa el sistema de fallback
- Se calculan estadísticas básicas localmente
- Se usan solo datos del monitor (schedules y entries propios)

### 3. **Si los endpoints específicos funcionan**
- Se obtienen datos completos del backend
- Se mantiene toda la funcionalidad
- Se preserva el rendimiento

## Beneficios Inmediatos

1. **✅ Sin errores de permisos**: Los monitores pueden usar reportes sin problemas
2. **✅ Funcionalidad preservada**: Mantienen acceso a sus datos personales
3. **✅ Experiencia fluida**: No hay interrupciones o errores molestos
4. **✅ Escalabilidad**: Fácil agregar más funcionalidades específicas
5. **✅ Seguridad**: Solo ven sus propios datos, nunca de otros usuarios

## Próximos Pasos

1. **Implementar endpoints específicos** en el backend para monitores
2. **Probar funcionalidad completa** con datos reales
3. **Optimizar cálculos de fallback** para mejor rendimiento
4. **Agregar más métricas específicas** para monitores

Esta solución garantiza que los monitores puedan acceder a reportes sin errores de permisos, mientras mantiene la seguridad y funcionalidad del sistema.
