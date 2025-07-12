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
  
  // Crear el archivo entrypoint si no existe
  const entrypointPath = path.join(__dirname, 'src', 'index.js');
  if (!fs.existsSync(entrypointPath)) {
    console.log('Creating entrypoint file...');
    const srcDir = path.join(__dirname, 'src');
    if (!fs.existsSync(srcDir)) {
      fs.mkdirSync(srcDir, { recursive: true });
    }
    
    // Crear un index.js básico si no existe
    const entrypointContent = `import { render } from 'preact';
import App from './components/app';
import './style/index.css';

export default App;

if (typeof window !== 'undefined') {
  render(<App />, document.getElementById('app'));
}`;
    
    fs.writeFileSync(entrypointPath, entrypointContent);
  }
  
  console.log('Running preact build...');
  
  // Intentar con preact build primero
  try {
    execSync('npx preact build --no-prerender', { 
      stdio: 'inherit',
      env: {
        ...process.env,
        NODE_OPTIONS: nodeOptions
      },
      cwd: process.cwd()
    });
  } catch (preactError) {
    console.log('Preact build failed, trying alternative approach...');
    
    // Si falla, intentar con webpack directamente
    try {
      execSync('npx webpack --mode=production', { 
        stdio: 'inherit',
        env: {
          ...process.env,
          NODE_OPTIONS: nodeOptions
        },
        cwd: process.cwd()
      });
    } catch (webpackError) {
      console.log('Webpack build failed, trying npm run build...');
      
      // Como último recurso, usar npm run build directamente
      execSync('npm run build', { 
        stdio: 'inherit',
        env: {
          ...process.env,
          NODE_OPTIONS: nodeOptions
        },
        cwd: process.cwd()
      });
    }
  }
  
  // Verificar que el directorio build existe
  const buildDir = path.join(process.cwd(), 'build');
  try {
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
