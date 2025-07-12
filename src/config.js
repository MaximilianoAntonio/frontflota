// Asegurar que siempre use HTTPS, incluso si alguien configura HTTP por error
const baseUrl = `https://apissvq.azurewebsites.net/api`;

export const API_BASE_URL = baseUrl;

// Función auxiliar para asegurar HTTPS en URLs
export const ensureHttps = (url) => {
  if (typeof url === 'string' && url.startsWith('http://')) {
    console.warn('⚠️  URL HTTP detectada, cambiando a HTTPS:', url);
    return url.replace('http://', 'https://');
  }
  return url;
};

console.log('🔧 API configurada:', API_BASE_URL);
