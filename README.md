# Proyecto 2 - Desarrollo de Software 2 - Frontend

[![Deployment](https://img.shields.io/badge/deploy-vercel-000000?logo=vercel)](https://ds2-2-front.vercel.app)  
Segundo Proyecto lado del cliente (frontend) de la asignatura de Desarrollo de Software II - Universidad del Valle

Descripción corta
-----------------
Frontend creado con Vite + TypeScript para la aplicación DS2 (Proyecto 2). Proporciona la interfaz de usuario y se despliega en Vercel: https://ds2-2-front.vercel.app

Contenido
---------
- [Características](#características)
- [Demo](#demo)
- [Requisitos](#requisitos)
- [Instalación y ejecución](#instalación-y-ejecución)
- [Scripts útiles](#scripts-útiles)
- [Estructura del proyecto](#estructura-del-proyecto)
- [Variables de entorno](#variables-de-entorno)
- [Desarrollo y pruebas](#desarrollo-y-pruebas)
- [Despliegue](#despliegue)
- [Contribuir](#contribuir)
- [Licencia](#licencia)
- [Contacto](#contacto)

Características
---------------
- Interfaz web moderna basada en Vite + TypeScript.
- Preparado para despliegue en Vercel (archivo `vercel.json` incluido).
- Estructura preparada para pruebas, lint y build optimizado.

Demo
----
Sitio desplegado: https://ds2-2-front.vercel.app

Requisitos
---------
- Node.js (se recomienda >= 16, idealmente >= 18)
- npm o yarn
- Acceso a la API backend correspondiente (si aplica)

Instalación y ejecución
----------------------
Clonar el repositorio e instalar dependencias:

```bash
git clone https://github.com/DS2-PROYECTO-2/ds2-2-front.git
cd ds2-2-front
npm ci
```

Modo desarrollo (hot-reload)
```bash
npm run dev
# o
# yarn dev
```

Generar build para producción
```bash
npm run build
```

Servir build localmente (preview)
```bash
npm run preview
```

Scripts útiles
--------------
Los scripts mostrados abajo son los más comunes en proyectos con Vite; ajusta según `package.json` real:

- npm run dev — arranca servidor de desarrollo
- npm run build — genera la versión de producción
- npm run preview — sirve la build para pruebas locales
- npm test — ejecuta la suite de tests (si existe)
- npm run lint — ejecuta linters (ESLint)
- npm run format — formatea código (Prettier u otra herramienta)

Estructura del proyecto
-----------------------
(Estructura principal)
- index.html
- package.json
- vite.config.ts
- tsconfig.json / tsconfig.app.json / tsconfig.node.json
- src/               — código fuente (componentes, estilos, utilidades)
- public/            — archivos estáticos servidos tal cual
- README.md
- SECURITY.md
- vercel.json        — configuración para despliegue en Vercel

Variables de entorno
--------------------
Si la app consume una API u otros servicios, usa variables de entorno con prefijo VITE_ (reconocidas por Vite). Ejemplos:

```
VITE_API_URL=https://api.example.com
VITE_GOOGLE_MAPS_KEY=tu_key
```

Crea un archivo `.env` o `.env.local` en la raíz y no lo compartas en el repositorio (añádelo al .gitignore si es necesario).

Desarrollo y pruebas
--------------------
- Mantén las dependencias actualizadas.
- Añade pruebas unitarias/integra con el framework elegido (Jest, Vitest, Testing Library).
- Ejecuta linters y formateadores antes de commits.
- Usa ramas descriptivas para features/fixes y PRs para revisión.

Despliegue
----------
Este repositorio incluye `vercel.json` y tiene un dominio desplegado en Vercel. Flujo típico:
1. Push a la rama principal (main) o abrir PR.
2. Vercel detecta el repo y ejecuta: npm ci && npm run build (ajusta si tu build script es distinto).
3. Revisa el despliegue en la URL de Vercel.

Contribuir
----------
1. Fork del repositorio.
2. Crear una rama feature/bugfix: `git checkout -b feature/nombre`
3. Hacer commits claros y abrir Pull Request hacia `main`.
4. Ejecutar pruebas y linters antes de enviar PR.

Licencia
--------
Realizados por estudiantes del programa acádemico Tecnología en Desarrollo de Software.

Buenas prácticas
----------------
- Documentar variables de entorno necesarias en `.env.example`.
- Incluir instrucciones de pruebas y de cómo ejecutar linters en el README.
- Añadir un CHANGELOG para cambios relevantes (opcional).
- Mantener `SECURITY.md` para políticas de reportes de vulnerabilidades (ya presente).

Contacto
--------
Organización: DS2-PROYECTO-2 — https://github.com/DS2-PROYECTO-2  
Proyecto desplegado: https://ds2-2-front.vercel.app
