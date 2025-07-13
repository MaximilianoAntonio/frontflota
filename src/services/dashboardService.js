// src/services/dashboardService.js
import axios from 'axios';
import { API_BASE_URL } from '../config';

const DASHBOARD_API_URL = `${API_BASE_URL}/dashboard/`;

/**
 * Obtiene todas las estadísticas del dashboard
 * @param {Object} params - Parámetros de filtrado
 * @param {string} params.periodo - Tipo de período: 'daily', 'weekly', 'monthly', 'quarterly', 'yearly', 'custom'
 * @param {string} params.fecha_inicio - Fecha de inicio (para período custom)
 * @param {string} params.fecha_fin - Fecha de fin (para período custom)
 * @returns {Promise<Object>} Datos completos del dashboard
 */
export const getDashboardStats = async (params = {}) => {
    try {
        const response = await axios.get(`${DASHBOARD_API_URL}stats/`, { params });
        return response.data;
    } catch (error) {
        console.error('Error obteniendo estadísticas del dashboard:', error);
        throw error;
    }
};

/**
 * Refresca el caché de datos del dashboard
 * @returns {Promise<Object>} Resultado de la actualización
 */
export const refreshDashboardCache = async () => {
    try {
        const response = await axios.post(`${DASHBOARD_API_URL}refresh-cache/`);
        return response.data;
    } catch (error) {
        console.error('Error refrescando caché del dashboard:', error);
        throw error;
    }
};

/**
 * Obtiene datos específicos para el mapa de asignaciones
 * @param {Object} params - Parámetros de filtrado
 * @returns {Promise<Object>} Datos para el mapa
 */
export const getMapData = async (params = {}) => {
    try {
        // Utilizamos el endpoint de asignaciones con filtros específicos para el mapa
        const response = await axios.get(`${API_BASE_URL}/asignaciones/`, {
            params: {
                ...params,
                // Solo asignaciones con coordenadas
                origen_lat__isnull: false,
                origen_lon__isnull: false,
                destino_lat__isnull: false,
                destino_lon__isnull: false,
            }
        });
        
        return response.data;
    } catch (error) {
        console.error('Error obteniendo datos del mapa:', error);
        throw error;
    }
};

/**
 * Obtiene el historial de mantenimiento para un vehículo específico
 * @param {number} vehiculoId - ID del vehículo
 * @returns {Promise<Array>} Historial de mantenimiento
 */
export const getMantenimientoHistorial = async (vehiculoId) => {
    try {
        // Este endpoint necesitaría ser implementado en el backend
        // Por ahora simularemos datos de mantenimiento
        return [
            {
                id: 1,
                fecha: '2024-12-01',
                tipo: 'Mantenimiento Preventivo',
                descripcion: 'Cambio de aceite y filtros',
                costo: 45000,
                kilometraje: 15000
            },
            {
                id: 2,
                fecha: '2024-11-15',
                tipo: 'Reparación',
                descripcion: 'Cambio de neumáticos',
                costo: 120000,
                kilometraje: 14500
            }
        ];
    } catch (error) {
        console.error('Error obteniendo historial de mantenimiento:', error);
        throw error;
    }
};

/**
 * Calcula métricas adicionales basadas en los datos obtenidos
 * @param {Object} rawData - Datos crudos del dashboard
 * @returns {Object} Métricas calculadas
 */
export const calculateAdditionalMetrics = (rawData) => {
    if (!rawData || !rawData.general) {
        return {};
    }

    const { general } = rawData;
    
    return {
        // Tasa de utilización de la flota
        tasaUtilizacionFlota: general.total_vehiculos > 0 
            ? ((general.vehiculos_en_uso + general.vehiculos_reservados) / general.total_vehiculos * 100).toFixed(1)
            : 0,
        
        // Eficiencia de asignaciones
        eficienciaAsignaciones: general.total_asignaciones > 0
            ? (general.asignaciones_completadas / general.total_asignaciones * 100).toFixed(1)
            : 0,
        
        // Promedio de kilometraje por asignación
        promedioKmPorAsignacion: general.asignaciones_completadas > 0
            ? (general.distancia_total_km / general.asignaciones_completadas).toFixed(2)
            : 0,
        
        // Disponibilidad de conductores
        disponibilidadConductores: general.total_conductores > 0
            ? (general.conductores_disponibles / general.total_conductores * 100).toFixed(1)
            : 0,
    };
};

/**
 * Formatea los datos para los gráficos de Chart.js
 * @param {Object} data - Datos del dashboard
 * @param {string} chartType - Tipo de gráfico
 * @returns {Object} Datos formateados para Chart.js
 */
export const formatChartData = (data, chartType) => {
    switch (chartType) {
        case 'estadoVehiculos':
            return {
                labels: ['Disponibles', 'En Uso', 'Mantenimiento', 'Reservados'],
                datasets: [{
                    data: [
                        data.general?.vehiculos_disponibles || 0,
                        data.general?.vehiculos_en_uso || 0,
                        data.general?.vehiculos_en_mantenimiento || 0,
                        data.general?.vehiculos_reservados || 0
                    ],
                    backgroundColor: [
                        '#10B981', // Verde - Disponibles
                        '#3B82F6', // Azul - En Uso
                        '#F59E0B', // Amarillo - Mantenimiento
                        '#8B5CF6'  // Púrpura - Reservados
                    ],
                    borderWidth: 2,
                    borderColor: '#ffffff'
                }]
            };
        
        case 'estadoConductores':
            return {
                labels: ['Disponibles', 'En Ruta', 'Día Libre', 'No Disponibles'],
                datasets: [{
                    data: [
                        data.general?.conductores_disponibles || 0,
                        data.general?.conductores_en_ruta || 0,
                        data.general?.conductores_dia_libre || 0,
                        data.general?.conductores_no_disponibles || 0
                    ],
                    backgroundColor: [
                        '#10B981', // Verde - Disponibles
                        '#3B82F6', // Azul - En Ruta
                        '#6B7280', // Gris - Día Libre
                        '#EF4444'  // Rojo - No Disponibles
                    ],
                    borderWidth: 2,
                    borderColor: '#ffffff'
                }]
            };
        
        case 'asignacionesPorEstado':
            return {
                labels: ['Completadas', 'Activas', 'Programadas', 'Canceladas'],
                datasets: [{
                    data: [
                        data.general?.asignaciones_completadas || 0,
                        data.general?.asignaciones_activas || 0,
                        data.general?.asignaciones_programadas || 0,
                        data.general?.asignaciones_canceladas || 0
                    ],
                    backgroundColor: [
                        '#10B981', // Verde - Completadas
                        '#3B82F6', // Azul - Activas
                        '#F59E0B', // Amarillo - Programadas
                        '#EF4444'  // Rojo - Canceladas
                    ],
                    borderWidth: 2,
                    borderColor: '#ffffff'
                }]
            };
        
        case 'tendenciasAsignaciones':
            // Este requeriría datos de tendencias del backend
            return {
                labels: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'],
                datasets: [{
                    label: 'Asignaciones por día',
                    data: [12, 19, 3, 5, 2, 3, 9], // Datos de ejemplo
                    borderColor: '#3B82F6',
                    backgroundColor: '#3B82F620',
                    tension: 0.4
                }]
            };
        
        default:
            return { labels: [], datasets: [] };
    }
};

/**
 * Obtiene alertas y notificaciones del sistema
 * @returns {Promise<Array>} Lista de alertas
 */
export const getSystemAlerts = async () => {
    try {
        // Por ahora retornamos alertas simuladas, esto debería venir del backend
        const alerts = [];
        
        // Simular algunas alertas basadas en datos reales si están disponibles
        // En una implementación real, esto vendría del backend
        return [
            {
                id: 1,
                tipo: 'mantenimiento',
                severidad: 'alta',
                titulo: 'Vehículo requiere mantenimiento',
                mensaje: 'El vehículo ABC-123 ha superado los 10,000 km desde el último mantenimiento',
                fecha: new Date().toISOString()
            },
            {
                id: 2,
                tipo: 'licencia',
                severidad: 'media',
                titulo: 'Licencia próxima a vencer',
                mensaje: 'La licencia del conductor Juan Pérez vence en 15 días',
                fecha: new Date().toISOString()
            }
        ];
    } catch (error) {
        console.error('Error obteniendo alertas del sistema:', error);
        return [];
    }
};

export default {
    getDashboardStats,
    refreshDashboardCache,
    getMapData,
    getMantenimientoHistorial,
    calculateAdditionalMetrics,
    formatChartData,
    getSystemAlerts
};
