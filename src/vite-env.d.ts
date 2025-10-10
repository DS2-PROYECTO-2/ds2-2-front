/// <reference types="vite/client" />

// Extender la interfaz Window para incluir propiedades personalizadas
declare global {
  interface Window {
    EMERGENCY_BYPASS?: boolean;
  }
}

// También declarar como módulo para asegurar compatibilidad
declare module 'global' {
  interface Window {
    EMERGENCY_BYPASS?: boolean;
  }
}
