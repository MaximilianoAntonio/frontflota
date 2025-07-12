// src/services/vehicleService.js
import apiClient from './axiosConfig';

// Función para obtener todos los vehículos
export const getVehiculos = async () => {
    let results = [];
    let nextUrl = '/vehiculos/';
    
    while (nextUrl) {
        console.log('🚗 Obteniendo vehículos desde:', nextUrl);
        const response = await apiClient.get(nextUrl);
        const data = response.data;
        
        if (Array.isArray(data)) {
            results = data;
            nextUrl = null;
        } else if (data && Array.isArray(data.results)) {
            results = results.concat(data.results);
            // Si hay una URL next, extraer solo la parte relativa
            if (data.next) {
                try {
                    const url = new URL(data.next);
                    nextUrl = url.pathname + url.search;
                    // Asegurar que sea relativa y use el baseURL configurado
                } catch (e) {
                    // Si no es una URL válida, asumir que es relativa
                    nextUrl = data.next;
                }
            } else {
                nextUrl = null;
            }
        } else {
            nextUrl = null;
        }
    }
    
    console.log('✅ Total vehículos obtenidos:', results.length);
    return results;
};

export const getVehiculoById = (id) => {
    return apiClient.get(`/vehiculos/${id}/`);
};

export const createVehiculo = (data) =>
  apiClient.post('/vehiculos/', data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

export const updateVehiculo = (id, data) =>
  apiClient.put(`/vehiculos/${id}/`, data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

export const deleteVehiculo = (id) => {
    return apiClient.delete(`/vehiculos/${id}/`);
};

// Podrías crear archivos similares para conductorService.js y asignacionService.js