// src/services/axiosConfig.js
import axios from 'axios';
import { API_BASE_URL } from '../config';

// Crear una instancia de axios con configuración base
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Interceptor de peticiones para asegurar HTTPS
apiClient.interceptors.request.use(
  (config) => {
    // Forzar HTTPS en todas las URLs
    if (config.url && config.url.startsWith('http://')) {
      config.url = config.url.replace('http://', 'https://');
      console.log('🔒 URL cambiada a HTTPS:', config.url);
    }
    
    if (config.baseURL && config.baseURL.startsWith('http://')) {
      config.baseURL = config.baseURL.replace('http://', 'https://');
      console.log('🔒 Base URL cambiada a HTTPS:', config.baseURL);
    }
    
    console.log('📡 Petición:', config.method?.toUpperCase(), config.url || config.baseURL);
    return config;
  },
  (error) => {
    console.error('❌ Error en interceptor de petición:', error);
    return Promise.reject(error);
  }
);

// Interceptor de respuestas para logging
apiClient.interceptors.response.use(
  (response) => {
    console.log('✅ Respuesta exitosa:', response.status, response.config.url);
    return response;
  },
  (error) => {
    console.error('❌ Error en petición:', {
      message: error.message,
      url: error.config?.url,
      status: error.response?.status,
      statusText: error.response?.statusText
    });
    return Promise.reject(error);
  }
);

export default apiClient;
