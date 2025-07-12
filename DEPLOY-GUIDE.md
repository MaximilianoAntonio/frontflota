# 📋 Guía Paso a Paso - Despliegue en Vercel

## 🚀 **Opción 1: Vercel (Recomendado)**

### **Paso 1: Preparar el repositorio**
```bash
# Asegúrate de que todo esté en Git
git add .
git commit -m "Preparar para despliegue en Vercel"
git push origin main
```

### **Paso 2: Crear cuenta en Vercel**
1. Ve a [vercel.com](https://vercel.com)
2. Haz clic en "Sign Up"
3. Selecciona "Continue with GitHub"
4. Autoriza Vercel a acceder a tu GitHub

### **Paso 3: Importar tu proyecto**
1. En el dashboard de Vercel, haz clic en "New Project"
2. Selecciona tu repositorio "Asignacion-vehiculos"
3. **IMPORTANTE:** Cambia el "Root Directory" a `asignacion`
4. Vercel detectará automáticamente que es un proyecto Preact

### **Paso 4: Configurar el proyecto**
- **Framework:** Preact (detección automática)
- **Root Directory:** `asignacion`
- **Build Command:** `npm run build` (automático)
- **Output Directory:** `build` (automático)

### **Paso 5: Configurar variables de entorno (si es necesario)**
1. Ve a Settings > Environment Variables
2. Agrega: `NODE_OPTIONS` = `--openssl-legacy-provider`

### **Paso 6: Deploy**
1. Haz clic en "Deploy"
2. Espera 2-3 minutos
3. ¡Tu app estará disponible en una URL como `https://asignacion-vehiculos.vercel.app`!

---

## 🔗 **Opción 2: Netlify**

### **Paso 1: Crear cuenta en Netlify**
1. Ve a [netlify.com](https://netlify.com)
2. Regístrate con GitHub

### **Paso 2: Deploy desde Git**
1. Haz clic en "New site from Git"
2. Selecciona GitHub
3. Elige tu repositorio "Asignacion-vehiculos"

### **Paso 3: Configurar build**
- **Base directory:** `asignacion`
- **Build command:** `npm run build`
- **Publish directory:** `asignacion/build`

### **Paso 4: Variables de entorno**
1. Ve a Site settings > Build & deploy > Environment
2. Agrega: `NODE_OPTIONS` = `--openssl-legacy-provider`

---

## 📱 **Opción 3: GitHub Pages (Solo archivos estáticos)**

### **Paso 1: Configurar package.json**
Agrega en scripts:
```json
"homepage": "https://MaximilianoAntonio.github.io/Asignacion-vehiculos"
```

### **Paso 2: Instalar gh-pages**
```bash
npm install --save-dev gh-pages
```

### **Paso 3: Agregar script de deploy**
```json
"scripts": {
  "predeploy": "npm run build",
  "deploy": "gh-pages -d build"
}
```

### **Paso 4: Deploy**
```bash
npm run deploy
```

---

## 🔧 **Verificación del despliegue**

Una vez desplegado, verifica que:
- ✅ La página principal carga correctamente
- ✅ El mapa se visualiza (con datos de prueba)
- ✅ La navegación funciona
- ✅ Los estilos se cargan correctamente
- ✅ La API se conecta (puede mostrar datos de prueba si la API está offline)

---

## 🌐 **URLs finales**

- **Vercel:** `https://tu-proyecto.vercel.app`
- **Netlify:** `https://tu-proyecto.netlify.app`
- **GitHub Pages:** `https://MaximilianoAntonio.github.io/Asignacion-vehiculos`

---

## 🔄 **Deploy automático**

Una vez configurado, cada vez que hagas:
```bash
git push origin main
```

Tu aplicación se actualizará automáticamente en la plataforma elegida.

---

## 📞 **¿Necesitas ayuda?**

Si tienes algún problema:
1. Revisa que el repositorio esté actualizado
2. Verifica que la carpeta `asignacion` contenga `package.json`
3. Asegúrate de que el build local funcione: `npm run build`
4. Revisa los logs de deploy en la plataforma elegida
