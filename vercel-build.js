#!/usr/bin/env node

// Script de build personalizado para Vercel que maneja problemas de ESM y entrypoint
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

try {
  console.log('Starting Vercel build...');
  console.log('Node version:', process.version);
  console.log('Working directory:', process.cwd());
  
  // Configurar NODE_OPTIONS para el build
  const nodeOptions = '--openssl-legacy-provider --max-old-space-size=4096';
  
  console.log('NODE_OPTIONS:', nodeOptions);
  console.log('Running preact build...');
  
  // Ejecutar preact build directamente con los parámetros apropiados
  execSync('npx preact build --no-prerender', { 
    stdio: 'inherit',
    env: {
      ...process.env,
      NODE_OPTIONS: nodeOptions,
      // Evitar problemas con ESM en Vercel
      NODE_ENV: 'production'
    },
    cwd: process.cwd()
  });
  
  // Verificar que el directorio build existe
  const buildDir = path.join(process.cwd(), 'build');
  try {
    const stats = fs.statSync(buildDir);
    if (stats.isDirectory()) {
      console.log('Build directory created successfully!');
      const files = fs.readdirSync(buildDir);
      console.log('Build files:', files.slice(0, 10).join(', '), files.length > 10 ? '...' : '');
      
      // Verificar que index.html existe
      const indexPath = path.join(buildDir, 'index.html');
      if (fs.existsSync(indexPath)) {
        console.log('index.html found - build appears successful');
      } else {
        throw new Error('index.html not found in build directory');
      }
    }
  } catch (e) {
    console.error('Build directory validation failed:', e.message);
    throw e;
  }
  
  console.log('Build completed successfully!');
} catch (error) {
  console.error('Build failed:', error.message);
  console.error('Error details:', error);
  process.exit(1);
}
