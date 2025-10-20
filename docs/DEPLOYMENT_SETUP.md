# Configuración de Despliegue Continuo en Vercel

## 🚀 Configuración Automática

Este proyecto está configurado para despliegue continuo en Vercel con las siguientes características:

### **Ramas de Despliegue:**
- **`main`** → Despliegue de **PRODUCCIÓN** (https://tu-proyecto.vercel.app)
- **`develop`** → Despliegue de **PREVIEW** (https://tu-proyecto-git-develop.vercel.app)

### **Flujo de CI/CD:**
1. **Push a `main` o `develop`** → Ejecuta tests, linting, build y despliegue automático
2. **Pull Request** → Ejecuta solo tests y linting (sin despliegue)

## 🔧 Configuración Requerida en GitHub

### **1. Secrets de GitHub (Settings → Secrets and variables → Actions)**

Necesitas agregar estos secrets en tu repositorio de GitHub:

```bash
VERCEL_TOKEN=tu_token_de_vercel
VERCEL_ORG_ID=tu_org_id
VERCEL_PROJECT_ID=tu_project_id
VERCEL_SCOPE=tu_scope
```

### **2. Cómo Obtener los Secrets de Vercel:**

#### **VERCEL_TOKEN:**
1. Ve a [Vercel Dashboard](https://vercel.com/account/tokens)
2. Crea un nuevo token
3. Copia el token generado

#### **VERCEL_ORG_ID y VERCEL_PROJECT_ID:**
1. Instala Vercel CLI: `npm i -g vercel`
2. En tu proyecto, ejecuta: `vercel link`
3. Esto creará un archivo `.vercel/project.json` con los IDs necesarios

#### **VERCEL_SCOPE:**
- Es tu username de Vercel o el nombre de tu organización

### **3. Configuración en Vercel Dashboard:**

1. Ve a tu proyecto en [Vercel Dashboard](https://vercel.com/dashboard)
2. Settings → Git → Connect GitHub Repository
3. Configura las ramas:
   - **Production Branch:** `main`
   - **Preview Branches:** `develop`

## 📋 Variables de Entorno

### **Variables Requeridas en Vercel:**

En el dashboard de Vercel, ve a Settings → Environment Variables y agrega:

```bash
VITE_API_URL=https://tu-backend-django.onrender.com
NODE_ENV=production
```

## 🔄 Flujo de Trabajo

### **Desarrollo:**
1. Trabaja en rama `develop`
2. Push → Despliegue automático a preview
3. Prueba en el preview de Vercel

### **Producción:**
1. Merge `develop` → `main`
2. Push a `main` → Despliegue automático a producción

## 🛠️ Comandos Útiles

### **Despliegue Manual:**
```bash
# Instalar Vercel CLI
npm i -g vercel

# Despliegue de preview
vercel

# Despliegue de producción
vercel --prod
```

### **Verificar Configuración:**
```bash
# Ver configuración actual
vercel project ls

# Ver logs de despliegue
vercel logs
```

## 📊 Monitoreo

- **GitHub Actions:** Ve a la pestaña "Actions" en tu repositorio
- **Vercel Dashboard:** Monitorea despliegues en tiempo real
- **Logs:** Revisa logs en Vercel Dashboard → Functions → Logs

## 🚨 Troubleshooting

### **Error: "VERCEL_TOKEN not found"**
- Verifica que el secret esté configurado en GitHub
- Asegúrate de que el token tenga permisos correctos

### **Error: "Build failed"**
- Revisa los logs en GitHub Actions
- Verifica que todas las dependencias estén en `package.json`

### **Error: "Deployment failed"**
- Revisa los logs en Vercel Dashboard
- Verifica las variables de entorno

## ✅ Checklist de Configuración

- [ ] Secrets configurados en GitHub
- [ ] Proyecto conectado en Vercel Dashboard
- [ ] Variables de entorno configuradas
- [ ] Rama `main` configurada como producción
- [ ] Rama `develop` configurada como preview
- [ ] Primer despliegue exitoso

## 📞 Soporte

Si tienes problemas con la configuración:
1. Revisa los logs en GitHub Actions
2. Verifica la configuración en Vercel Dashboard
3. Consulta la [documentación de Vercel](https://vercel.com/docs)
