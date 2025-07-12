# 🚀 Gestor de Vehículos - Frontend

## Despliegue en Vercel

### Pasos para desplegar:

1. **Crear cuenta en Vercel**
   - Ve a [vercel.com](https://vercel.com)
   - Regístrate con tu cuenta de GitHub

2. **Conectar tu repositorio**
   - Haz clic en "New Project"
   - Selecciona tu repositorio "Asignacion-vehiculos"
   - Selecciona la carpeta `asignacion` como directorio raíz

3. **Configuración automática**
   - Vercel detectará automáticamente que es un proyecto Preact
   - Usará la configuración de `vercel.json`

4. **Deploy**
   - Haz clic en "Deploy"
   - Tu aplicación estará disponible en una URL como: `https://tu-proyecto.vercel.app`

### Configuración manual si es necesaria:

- **Build Command:** `npm run build`
- **Output Directory:** `build`
- **Install Command:** `npm install`

### Variables de entorno en Vercel:

Si necesitas configurar variables de entorno:
1. Ve a Settings > Environment Variables
2. Agrega: `NODE_OPTIONS` = `--openssl-legacy-provider`

## Características del despliegue:

✅ **Deploy automático** - Cada push a main despliega automáticamente
✅ **HTTPS** - Certificado SSL automático
✅ **CDN Global** - Carga rápida en todo el mundo
✅ **Dominio personalizado** - Puedes agregar tu propio dominio
✅ **Previsualización** - Cada PR genera una URL de preview

## URLs importantes:

- **Producción:** Se generará automáticamente
- **API Backend:** https://apissvq.azurewebsites.net/api
- **Repositorio:** https://github.com/MaximilianoAntonio/Asignacion-vehiculos

## Estructura del proyecto:

```
asignacion/
├── src/
│   ├── components/     # Componentes reutilizables
│   ├── routes/        # Páginas de la aplicación
│   ├── services/      # Servicios para API
│   └── style/         # Estilos globales
├── build/             # Archivos compilados (generado)
├── package.json       # Dependencias
├── vercel.json       # Configuración de Vercel
└── .env.production   # Variables de entorno
```
