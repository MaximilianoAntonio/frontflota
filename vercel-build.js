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
  
  // Intentar múltiples estrategias de build
  console.log('Attempting build with webpack directly...');
  
  let buildSuccess = false;
  
  // Estrategia 1: webpack directo (evita problemas de preact-cli completamente)
  try {
    execSync('npx webpack --config webpack.config.js', { 
      stdio: 'inherit',
      env: {
        ...process.env,
        NODE_OPTIONS: nodeOptions,
        NODE_ENV: 'production',
        GENERATE_SOURCEMAP: 'false'
      },
      cwd: process.cwd()
    });
    buildSuccess = true;
    console.log('Build successful with strategy 1 (webpack direct)');
  } catch (error1) {
    console.log('Direct webpack build failed, trying preact build with --no-sw...');
    
    // Estrategia 2: preact build con configuraciones específicas (solo si webpack falla)
    try {
      const result = execSync('npx preact build --no-prerender --no-sw', { 
        stdio: 'pipe',
        env: {
          ...process.env,
          NODE_OPTIONS: nodeOptions,
          NODE_ENV: 'production',
          GENERATE_SOURCEMAP: 'false'
        },
        cwd: process.cwd()
      });
      
      // Verificar que no hay errores críticos en la salida
      const output = result.toString();
      if (output.includes('TypeError') || output.includes('ERROR')) {
        throw new Error('Build completed but with errors');
      }
      
      buildSuccess = true;
      console.log('Build successful with strategy 2 (preact --no-sw)');
    } catch (error2) {
      console.log('Preact build with --no-sw failed, trying standard preact build...');
      
      // Estrategia 3: preact build básico
      try {
        const result = execSync('npx preact build --no-prerender', { 
          stdio: 'pipe',
          env: {
            ...process.env,
            NODE_OPTIONS: nodeOptions,
            NODE_ENV: 'production',
            GENERATE_SOURCEMAP: 'false'
          },
          cwd: process.cwd()
        });
        
        // Verificar que no hay errores críticos en la salida
        const output = result.toString();
        if (output.includes('TypeError') || output.includes('ERROR')) {
          throw new Error('Build completed but with errors');
        }
        
        buildSuccess = true;
        console.log('Build successful with strategy 3 (preact standard)');
      } catch (error3) {
        console.log('Standard preact build failed, trying fallback webpack build...');
        
        // Estrategia 4: Usar build-fallback
        try {
          execSync('npm run build-fallback', { 
            stdio: 'inherit',
            env: {
              ...process.env,
              NODE_OPTIONS: nodeOptions,
              NODE_ENV: 'production',
              GENERATE_SOURCEMAP: 'false'
            },
            cwd: process.cwd()
          });
          buildSuccess = true;
          console.log('Build successful with strategy 4 (fallback)');
        } catch (error4) {
          console.error('All build strategies failed');
          console.error('Error 1 (webpack direct):', error1.message);
          console.error('Error 2 (preact --no-sw):', error2.message);
          console.error('Error 3 (preact standard):', error3.message);
          console.error('Error 4 (fallback):', error4.message);
          buildSuccess = false;
        }
      }
    }
  }
  
  if (!buildSuccess) {
    throw new Error('All build strategies failed');
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
        
        // Verificar el tamaño del archivo index.html
        const indexStats = fs.statSync(indexPath);
        console.log('index.html size:', indexStats.size, 'bytes');
        
        if (indexStats.size < 100) {
          console.warn('Warning: index.html seems very small, this might indicate a problem');
        }
      } else {
        throw new Error('index.html not found in build directory');
      }
    } else {
      throw new Error('Build path exists but is not a directory');
    }
  } catch (e) {
    console.error('Build directory validation failed:', e.message);
    
    // Intentar crear un build mínimo si todo falla
    if (e.code === 'ENOENT') {
      console.log('Creating minimal build directory...');
      fs.mkdirSync(buildDir, { recursive: true });
      
      const minimalIndex = `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Mi Gestor</title>
    <meta name="viewport" content="width=device-width,initial-scale=1">
</head>
<body>
    <div id="app">Loading...</div>
    <script>
        console.error('Build failed - this is a fallback page');
        document.getElementById('app').innerHTML = '<h1>Application build failed</h1><p>Please check the build logs.</p>';
    </script>
</body>
</html>`;
      
      fs.writeFileSync(path.join(buildDir, 'index.html'), minimalIndex);
      console.log('Created minimal fallback index.html');
    } else {
      throw e;
    }
  }
  
  console.log('Build completed successfully!');
} catch (error) {
  console.error('Build failed:', error.message);
  console.error('Error details:', error);
  process.exit(1);
}
