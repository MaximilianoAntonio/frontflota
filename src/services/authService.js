// src/services/authService.js
import apiClient from './axiosConfig';

let authToken = null;

export async function loginUser({ username, password }) {
    try {
        console.log('🔐 Intentando login...');
        const response = await apiClient.post('/get-token/', { username, password });
        console.log('✅ Login exitoso');
        return response.data;
    } catch (error) {
        console.error('❌ Error en login:', error.message);
        throw error;
    }
}

export const logoutUser = () => {
    authToken = null;
    localStorage.removeItem('authToken');
    delete apiClient.defaults.headers.common['Authorization'];
    console.log('🚪 Usuario deslogueado');
    // Aquí podrías querer redirigir al usuario o actualizar el estado de la UI
};

export const getToken = () => {
    if (!authToken) {
        authToken = localStorage.getItem('authToken');
        if (authToken) {
             apiClient.defaults.headers.common['Authorization'] = `Token ${authToken}`;
        }
    }
    return authToken;
};

// Llama a getToken al inicio para configurar el header si ya existe un token
getToken();