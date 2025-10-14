# Implementación de Actualizaciones Pasivas

## Resumen

Se ha implementado un sistema completo de actualizaciones pasivas para resolver el problema de recargas innecesarias cuando el usuario navega fuera de la aplicación y regresa. Esto mejora significativamente la experiencia del usuario al eliminar las esperas molestas.

## Problemas Identificados

1. **Múltiples listeners agresivos**: Los componentes tenían listeners de `visibilitychange` y `focus` que recargaban datos inmediatamente
2. **Falta de caché inteligente**: No había estrategias de caché para datos que no cambian frecuentemente
3. **Re-renders innecesarios**: El AuthProvider causaba re-renders en cascada
4. **Actualizaciones en tiempo real muy agresivas**: Se recargaban datos por eventos menores

## Soluciones Implementadas

### 1. Sistema de Caché Inteligente (`src/utils/cacheManager.ts`)

- **TTL (Time To Live)**: Los datos se cachean con tiempo de expiración
- **Invalidación selectiva**: Se pueden invalidar claves específicas o por patrones
- **Persistencia**: Los datos críticos se guardan en localStorage
- **Limpieza automática**: Se limpian entradas expiradas automáticamente

```typescript
// Ejemplo de uso
const cached = cacheManager.get<Data>('key');
if (!cached) {
  const data = await fetchData();
  cacheManager.set('key', data, 5 * 60 * 1000); // 5 minutos
}
```

### 2. Hook de Actualizaciones Pasivas (`src/hooks/usePassiveUpdates.ts`)

- **Debounce inteligente**: Evita actualizaciones muy frecuentes
- **Detección de inactividad**: Solo actualiza después de períodos de inactividad
- **Configuración flexible**: Se puede personalizar por componente
- **Fallback a datos en caché**: Usa datos cacheados cuando es posible

```typescript
// Ejemplo de uso
const { forceUpdate } = usePassiveUpdates({
  minUpdateInterval: 60000, // 1 minuto mínimo
  inactivityThreshold: 15000, // 15 segundos de inactividad
  enableVisibilityUpdates: true,
  enableFocusUpdates: false, // Deshabilitar actualizaciones por foco
  onUpdate: loadData
});
```

### 3. Hook de Datos Inteligentes (`src/hooks/useSmartData.ts`)

- **Caché automático**: Combina caché con actualizaciones pasivas
- **Fallback data**: Usa datos de respaldo si falla la carga
- **Pre-carga**: Carga datos en background
- **Invalidación inteligente**: Invalida caché basado en dependencias

```typescript
// Ejemplo de uso
const { data, loading, error, refetch } = useSmartData({
  fetcher: () => api.getData(),
  cacheKey: 'user_data',
  ttl: 5 * 60 * 1000,
  enablePassiveUpdates: true
});
```

### 4. Servicio de API con Caché (`src/services/cachedApiService.ts`)

- **Caché automático**: Cachea respuestas GET automáticamente
- **Invalidación inteligente**: Invalida caché relacionado en operaciones POST/PATCH/DELETE
- **Fallback**: Usa datos de respaldo si falla la API
- **Pre-carga**: Pre-carga datos críticos

### 5. Optimizaciones del AuthProvider

- **Memoización**: El contexto se memoiza para evitar re-renders
- **Hidratación mejorada**: Mejor manejo del estado de hidratación
- **Caché de dashboard**: Los datos del dashboard se cachean

## Componentes Optimizados

### ScheduleCalendar
- **Antes**: Recargaba datos en cada `visibilitychange` y `focus`
- **Después**: Solo actualiza después de 1 minuto de inactividad y eventos críticos

### RoomStatsRow
- **Antes**: Recargaba en cada evento de schedule
- **Después**: Actualizaciones pasivas cada 30 segundos, solo eventos críticos

### TurnComparisonTable
- **Antes**: Recargaba en cada cambio de visibilidad
- **Después**: Actualizaciones pasivas cada 2 minutos, solo eventos importantes

### NotificationBell
- **Antes**: Debounce de 1 segundo
- **Después**: Debounce de 2 segundos para reducir carga

## Beneficios

1. **Experiencia de usuario mejorada**: No más esperas molestas al regresar a la app
2. **Rendimiento optimizado**: Menos llamadas a la API innecesarias
3. **Datos más frescos**: Sistema inteligente que actualiza cuando es necesario
4. **Caché eficiente**: Los datos se reutilizan cuando es apropiado
5. **Configuración flexible**: Cada componente puede tener su propia estrategia

## Configuración Recomendada

### Para datos que cambian frecuentemente (notificaciones, estadísticas)
```typescript
{
  minUpdateInterval: 30000, // 30 segundos
  enableVisibilityUpdates: true,
  enableFocusUpdates: false
}
```

### Para datos estables (perfiles, configuraciones)
```typescript
{
  minUpdateInterval: 300000, // 5 minutos
  enableVisibilityUpdates: false,
  enableFocusUpdates: false
}
```

### Para datos críticos (calendarios, reportes)
```typescript
{
  minUpdateInterval: 60000, // 1 minuto
  enableVisibilityUpdates: true,
  enableFocusUpdates: false
}
```

## Monitoreo

El sistema incluye métricas de rendimiento que se pueden acceder:

```typescript
import { performanceOptimizer } from '../utils/performanceOptimizer';

const metrics = performanceOptimizer.getPerformanceMetrics();
console.log('Cache stats:', metrics.cacheStats);
```

## Próximos Pasos

1. **Monitoreo en producción**: Implementar métricas de uso real
2. **Optimización adicional**: Ajustar TTLs basado en patrones de uso
3. **Pre-carga inteligente**: Implementar pre-carga basada en comportamiento del usuario
4. **Service Workers**: Considerar implementar service workers para caché offline

Esta implementación resuelve completamente el problema de recargas innecesarias y proporciona una base sólida para futuras optimizaciones de rendimiento.
