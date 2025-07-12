#!/bin/bash
# Script para limpiar y actualizar dependencias

echo "🧹 Limpiando node_modules..."
rm -rf node_modules
rm -f package-lock.json

echo "📦 Instalando dependencias actualizadas..."
npm install

echo "🔧 Ejecutando auditoría de seguridad..."
npm audit fix --force

echo "✅ Dependencias actualizadas correctamente!"
