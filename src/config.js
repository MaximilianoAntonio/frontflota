// Configuración de la API
export const API_BASE_URL = `https://web-production-5e000.up.railway.app/api`;

// Configuración adicional para debugging
export const API_CONFIG = {
    timeout: 10000,
    retries: 3,
    headers: {
        'Content-Type': 'application/json',
    }
};

// Helper para verificar si la API está disponible
export const checkApiHealth = async () => {
    try {
        const response = await fetch(`${API_BASE_URL}/health/`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            }
        });
        return response.ok;
    } catch (error) {
        console.error('API Health Check Failed:', error);
        return false;
    }
};
