#!/usr/bin/env node

// Script de build personalizado para Vercel que maneja problemas de ESM
const { execSync } = require('child_process');
const path = require('path');

try {
  console.log('Starting Vercel build...');
  console.log('Node version:', process.version);
  console.log('Working directory:', process.cwd());
  
  // Configurar NODE_OPTIONS para el build
  const nodeOptions = '--openssl-legacy-provider --max-old-space-size=4096';
  
  console.log('NODE_OPTIONS:', nodeOptions);
  console.log('Running preact build...');
  
  execSync('npx preact build --no-prerender', { 
    stdio: 'inherit',
    env: {
      ...process.env,
      NODE_OPTIONS: nodeOptions
    },
    cwd: process.cwd()
  });
  
  // Verificar que el directorio build existe
  const buildDir = path.join(process.cwd(), 'build');
  try {
    const fs = require('fs');
    const stats = fs.statSync(buildDir);
    if (stats.isDirectory()) {
      console.log('Build directory created successfully!');
      const files = fs.readdirSync(buildDir);
      console.log('Build files:', files.slice(0, 10).join(', '), files.length > 10 ? '...' : '');
    }
  } catch (e) {
    console.error('Build directory not found!');
    throw e;
  }
  
  console.log('Build completed successfully!');
} catch (error) {
  console.error('Build failed:', error.message);
  console.error('Error details:', error);
  process.exit(1);
}
