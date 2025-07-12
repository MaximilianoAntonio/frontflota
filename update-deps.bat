@echo off
REM Script para limpiar y actualizar dependencias en Windows

echo 🧹 Limpiando node_modules...
if exist node_modules rmdir /s /q node_modules
if exist package-lock.json del package-lock.json

echo 📦 Instalando dependencias actualizadas...
npm install

echo 🔧 Ejecutando auditoría de seguridad...
npm audit fix --force

echo ✅ Dependencias actualizadas correctamente!
