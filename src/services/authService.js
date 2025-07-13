// src/services/authService.js
import axios from 'axios';
import { API_BASE_URL } from '../config';

const LOGIN_API_URL = `${API_BASE_URL}/get-token/`; // Corresponde al endpoint de Django

let authToken = null;

// Configurar interceptor para manejar errores 401 globalmente
axios.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            // Token expirado o inválido, limpiar y redirigir al login
            logoutUser();
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export async function loginUser({ username, password }) {
    try {
        const response = await fetch(LOGIN_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            const error = new Error('Login failed');
            error.response = { status: response.status, data: errorData };
            throw error;
        }
        
        const data = await response.json();
        
        // Guardar token y configurar headers
        if (data.token) {
            authToken = data.token;
            localStorage.setItem('authToken', authToken);
            axios.defaults.headers.common['Authorization'] = `Token ${authToken}`;
        }
        
        return data;
    } catch (error) {
        console.error('Login error:', error);
        throw error;
    }
}

export const logoutUser = () => {
    authToken = null;
    localStorage.removeItem('authToken');
    localStorage.removeItem('userGroups'); // Limpiar grupos también
    delete axios.defaults.headers.common['Authorization'];
    // Limpiar cualquier otra información de sesión
};

export const getToken = () => {
    if (!authToken) {
        authToken = localStorage.getItem('authToken');
        if (authToken) {
            axios.defaults.headers.common['Authorization'] = `Token ${authToken}`;
        }
    }
    return authToken;
};

export const isAuthenticated = () => {
    const token = getToken();
    return token !== null && token !== undefined && token.trim() !== '';
};

// Función para hacer requests con autenticación automática
export const authenticatedFetch = async (url, options = {}) => {
    const token = getToken();
    
    const defaultHeaders = {
        'Content-Type': 'application/json',
    };
    
    if (token) {
        defaultHeaders['Authorization'] = `Token ${token}`;
    }
    
    const mergedOptions = {
        ...options,
        headers: {
            ...defaultHeaders,
            ...options.headers,
        },
    };
    
    try {
        const response = await fetch(url, mergedOptions);
        
        if (response.status === 401) {
            // Token expirado, limpiar y redirigir
            logoutUser();
            window.location.href = '/login';
            throw new Error('Authentication required');
        }
        
        return response;
    } catch (error) {
        console.error('Authenticated fetch error:', error);
        throw error;
    }
};

// Llama a getToken al inicio para configurar el header si ya existe un token
getToken();