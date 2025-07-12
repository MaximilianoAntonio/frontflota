#!/usr/bin/env node

// Script de build personalizado para Vercel que evita problemas con preact-cli-entrypoint
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
  
  // Crear un entrypoint temporal para resolver el problema de preact-cli-entrypoint
  const entrypointPath = path.join(process.cwd(), 'node_modules', 'preact-cli', 'src', 'lib', 'preact-cli-entrypoint.js');
  const entrypointDir = path.dirname(entrypointPath);
  
  // Crear el directorio si no existe
  if (!fs.existsSync(entrypointDir)) {
    fs.mkdirSync(entrypointDir, { recursive: true });
  }
  
  // Crear el archivo entrypoint que falta
  if (!fs.existsSync(entrypointPath)) {
    console.log('Creating missing preact-cli-entrypoint...');
    const entrypointContent = `
// Temporary entrypoint for Vercel build
import { render } from 'preact';
import App from '${path.resolve(process.cwd(), 'src/index.js')}';

if (typeof window !== 'undefined') {
  render(<App />, document.body);
}

export default App;
`;
    fs.writeFileSync(entrypointPath, entrypointContent);
  }
  
  console.log('Running preact build...');
  
  try {
    execSync('npx preact build --no-prerender', { 
      stdio: 'inherit',
      env: {
        ...process.env,
        NODE_OPTIONS: nodeOptions,
        NODE_ENV: 'production'
      },
      cwd: process.cwd()
    });
  } catch (preactError) {
    console.log('Preact build failed, trying fallback method...');
    
    // Usar el build fallback con cross-env
    execSync('npm run build-fallback', { 
      stdio: 'inherit',
      env: {
        ...process.env,
        NODE_OPTIONS: nodeOptions,
        NODE_ENV: 'production'
      },
      cwd: process.cwd()
    });
  }
  
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
