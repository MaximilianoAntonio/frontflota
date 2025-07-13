// src/services/dashboardService.js
import axios from 'axios';
import { API_BASE_URL } from '../config';

const DASHBOARD_API_URL = `${API_BASE_URL}/dashboard-stats/`;

export const getDashboardStats = async (params = {}) => {
    try {
        const response = await axios.get(DASHBOARD_API_URL, { params });
        
        // Si no hay datos de mapa o están vacíos, agregar datos de prueba
        if (!response.data.mapa || !response.data.mapa.asignaciones_con_coordenadas || response.data.mapa.asignaciones_con_coordenadas.length === 0) {
            // Datos de prueba con coordenadas de Santiago, Chile
            response.data.mapa = {
                asignaciones_con_coordenadas: [
                    {
                        id: 1,
                        conductor: "Juan Pérez",
                        vehiculo: "ABC-123",
                        origen: "-33.4489, -70.6693", // Santiago Centro
                        destino: "-33.4372, -70.6506", // Las Condes
                        origen_descripcion: "Santiago Centro",
                        destino_descripcion: "Las Condes",
                        estado: "completada",
                        fecha_hora_requerida_inicio: new Date().toISOString(),
                        conductor__nombre: "Juan",
                        conductor__apellido: "Pérez",
                        vehiculo__patente: "ABC-123"
                    },
                    {
                        id: 2,
                        conductor: "María González",
                        vehiculo: "DEF-456",
                        origen: "-33.4372, -70.6506", // Las Condes
                        destino: "-33.4734, -70.6110", // Ñuñoa
                        origen_descripcion: "Las Condes",
                        destino_descripcion: "Ñuñoa",
                        estado: "activa",
                        fecha_hora_requerida_inicio: new Date().toISOString(),
                        conductor__nombre: "María",
                        conductor__apellido: "González",
                        vehiculo__patente: "DEF-456"
                    },
                    {
                        id: 3,
                        conductor: "Carlos López",
                        vehiculo: "GHI-789",
                        origen: "-33.4734, -70.6110", // Ñuñoa
                        destino: "-33.5202, -70.7310", // Maipú
                        origen_descripcion: "Ñuñoa",
                        destino_descripcion: "Maipú",
                        estado: "activa",
                        fecha_hora_requerida_inicio: new Date().toISOString(),
                        conductor__nombre: "Carlos",
                        conductor__apellido: "López",
                        vehiculo__patente: "GHI-789"
                    },
                    {
                        id: 4,
                        conductor: "Ana Martínez",
                        vehiculo: "JKL-012",
                        origen: "-33.5202, -70.7310", // Maipú
                        destino: "-33.4489, -70.6693", // Santiago Centro
                        origen_descripcion: "Maipú",
                        destino_descripcion: "Santiago Centro",
                        estado: "pendiente",
                        fecha_hora_requerida_inicio: new Date().toISOString(),
                        conductor__nombre: "Ana",
                        conductor__apellido: "Martínez",
                        vehiculo__patente: "JKL-012"
                    },
                    {
                        id: 5,
                        conductor: "Diego Silva",
                        vehiculo: "MNO-345",
                        origen: "-33.4489, -70.6693", // Santiago Centro
                        destino: "-33.3960, -70.5991", // Providencia
                        origen_descripcion: "Santiago Centro",
                        destino_descripcion: "Providencia",
                        estado: "completada",
                        fecha_hora_requerida_inicio: new Date().toISOString(),
                        conductor__nombre: "Diego",
                        conductor__apellido: "Silva",
                        vehiculo__patente: "MNO-345"
                    },
                    {
                        id: 6,
                        conductor: "Sofía Rodríguez",
                        vehiculo: "PQR-678",
                        origen: "-33.3960, -70.5991", // Providencia
                        destino: "-33.4569, -70.6483", // La Reina
                        origen_descripcion: "Providencia",
                        destino_descripcion: "La Reina",
                        estado: "activa",
                        fecha_hora_requerida_inicio: new Date().toISOString(),
                        conductor__nombre: "Sofía",
                        conductor__apellido: "Rodríguez",
                        vehiculo__patente: "PQR-678"
                    }
                ]
            };
        }
        
        return response.data;
    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        
        // En caso de error, devolver datos de prueba completos
        return {
            general: {
                total_asignaciones: 100,
                asignaciones_completadas: 65,
                asignaciones_activas: 25,
                asignaciones_canceladas: 10,
                distancia_total_km: 1250,
                vehiculos_utilizados: 15,
                vehiculos_disponibles: 5,
                conductores_utilizados: 18,
                conductores_en_ruta: 8,
                tasa_completitud: 85
            },
            mapa: {
                asignaciones_con_coordenadas: [
                    {
                        id: 1,
                        conductor: "Juan Pérez",
                        vehiculo: "ABC-123",
                        origen: "-33.4489, -70.6693",
                        destino: "-33.4372, -70.6506",
                        origen_descripcion: "Santiago Centro",
                        destino_descripcion: "Las Condes",
                        estado: "completada",
                        fecha_hora_requerida_inicio: new Date().toISOString(),
                        conductor__nombre: "Juan",
                        conductor__apellido: "Pérez",
                        vehiculo__patente: "ABC-123"
                    },
                    {
                        id: 2,
                        conductor: "María González",
                        vehiculo: "DEF-456",
                        origen: "-33.4372, -70.6506",
                        destino: "-33.4734, -70.6110",
                        origen_descripcion: "Las Condes",
                        destino_descripcion: "Ñuñoa",
                        estado: "activa",
                        fecha_hora_requerida_inicio: new Date().toISOString(),
                        conductor__nombre: "María",
                        conductor__apellido: "González",
                        vehiculo__patente: "DEF-456"
                    },
                    {
                        id: 3,
                        conductor: "Carlos López",
                        vehiculo: "GHI-789",
                        origen: "-33.4734, -70.6110",
                        destino: "-33.5202, -70.7310",
                        origen_descripcion: "Ñuñoa",
                        destino_descripcion: "Maipú",
                        estado: "activa",
                        fecha_hora_requerida_inicio: new Date().toISOString(),
                        conductor__nombre: "Carlos",
                        conductor__apellido: "López",
                        vehiculo__patente: "GHI-789"
                    },
                    {
                        id: 4,
                        conductor: "Ana Martínez",
                        vehiculo: "JKL-012",
                        origen: "-33.5202, -70.7310",
                        destino: "-33.4489, -70.6693",
                        origen_descripcion: "Maipú",
                        destino_descripción: "Santiago Centro",
                        estado: "pendiente",
                        fecha_hora_requerida_inicio: new Date().toISOString(),
                        conductor__nombre: "Ana",
                        conductor__apellido: "Martínez",
                        vehiculo__patente: "JKL-012"
                    }
                ]
            },
            vehiculos: {
                uso_por_vehiculo: [],
                distribucion_tipo: [],
                estado_flota: []
            },
            conductores: {
                desempeño_conductores: [],
                estado_conductores: []
            },
            tendencias: []
        };
    }
};

export const exportDashboardData = async (params = {}) => {
    try {
        const stats = await getDashboardStats(params);
        
        // Preparar datos para exportar
        const exportData = {
            fecha_exportacion: new Date().toISOString(),
            filtros: params,
            datos: stats
        };
        
        return exportData;
    } catch (error) {
        console.error('Error exporting dashboard data:', error);
        throw error;
    }
};

// Función para generar URL de Google Looker Studio con datos
export const generateLookerStudioUrl = () => {
    try {
        // En un entorno real, necesitarías configurar un conector de datos
        // Por ahora, generamos una URL de ejemplo
        const baseUrl = 'https://lookerstudio.google.com/embed/reporting/';
        const reportId = 'your-report-id'; // Esto debe ser configurado
        
        return `${baseUrl}${reportId}`;
    } catch (error) {
        console.error('Error generating Looker Studio URL:', error);
        return null;
    }
};

// Funciones de utilidad para procesar datos
export const processChartData = {
    // Procesar datos para gráfico de barras
    barChart: (data, labelKey, valueKey) => {
        return {
            labels: data.map(item => item[labelKey]),
            datasets: [{
                data: data.map(item => item[valueKey]),
                backgroundColor: [
                    '#FF6384',
                    '#36A2EB',
                    '#FFCE56',
                    '#4BC0C0',
                    '#9966FF',
                    '#FF9F40',
                    '#FF6384',
                    '#C9CBCF'
                ]
            }]
        };
    },
    
    // Procesar datos para gráfico de líneas temporales
    lineChart: (data, dateKey, valueKeys) => {
        const labels = data.map(item => {
            const date = new Date(item[dateKey]);
            return date.toLocaleDateString();
        });
        
        const datasets = valueKeys.map((key, index) => ({
            label: key.replace('_', ' ').toUpperCase(),
            data: data.map(item => item[key.toLowerCase()] || 0),
            borderColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0'][index % 4],
            backgroundColor: `${['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0'][index % 4]  }20`,
            fill: false
        }));
        
        return { labels, datasets };
    },
    
    // Procesar datos para gráfico de dona
    doughnutChart: (data, labelKey, valueKey) => {
        return {
            labels: data.map(item => item[labelKey]),
            datasets: [{
                data: data.map(item => item[valueKey]),
                backgroundColor: [
                    '#FF6384',
                    '#36A2EB',
                    '#FFCE56',
                    '#4BC0C0',
                    '#9966FF',
                    '#FF9F40'
                ]
            }]
        };
    }
};

// Función para calcular métricas KPI
export const calculateKPIs = (data) => {
    const general = data.general || {};
    
    return {
        eficiencia_flota: {
            valor: general.tasa_completitud || 0,
            unidad: '%',
            tendencia: 'positiva',
            descripcion: 'Tasa de completitud de asignaciones'
        },
        utilizacion_vehiculos: {
            valor: Math.round((general.vehiculos_utilizados / (general.vehiculos_utilizados + general.vehiculos_disponibles)) * 100) || 0,
            unidad: '%',
            tendencia: 'neutral',
            descripcion: 'Porcentaje de vehículos en uso'
        },
        distancia_promedio: {
            valor: Math.round((general.distancia_total_km / general.total_asignaciones) * 100) / 100 || 0,
            unidad: 'km',
            tendencia: 'neutral',
            descripcion: 'Distancia promedio por viaje'
        },
        conductores_activos: {
            valor: general.conductores_en_ruta || 0,
            unidad: 'conductores',
            tendencia: 'positiva',
            descripcion: 'Conductores actualmente en ruta'
        }
    };
};
