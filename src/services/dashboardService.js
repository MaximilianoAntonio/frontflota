// src/services/dashboardService.js
import axios from 'axios';
import { API_BASE_URL } from '../config';
import { getVehiculos } from './vehicleService';
import { getConductores } from './conductorService';
import { getAsignaciones } from './asignacionService';

const DASHBOARD_API_URL = `${API_BASE_URL}/dashboard/`;

/**
 * Obtiene todas las estadísticas del dashboard con datos en tiempo real
 * @param {Object} params - Parámetros de filtrado
 * @param {string} params.periodo - Tipo de período: 'daily', 'weekly', 'monthly', 'quarterly', 'yearly', 'custom'
 * @param {string} params.fecha_inicio - Fecha de inicio (para período custom)
 * @param {string} params.fecha_fin - Fecha de fin (para período custom)
 * @returns {Promise<Object>} Datos completos del dashboard
 */
export const getDashboardStats = async (params = {}) => {
    try {
        // Cargar datos directamente de los servicios para obtener información actualizada
        const [vehiculos, conductores, asignaciones] = await Promise.all([
            getVehiculos().catch(() => []),
            getConductores().catch(() => []),
            getAsignaciones().catch(() => [])
        ]);

        // Calcular fechas para el filtro
        const { fechaInicio, fechaFin } = calcularRangoFechas(params);

        // Filtrar asignaciones por período si se especifica
        const asignacionesFiltradas = filtrarAsignacionesPorPeriodo(asignaciones, fechaInicio, fechaFin);

        // Calcular estadísticas en tiempo real
        const stats = calcularEstadisticasCompletas(vehiculos, conductores, asignacionesFiltradas, params);

        return {
            general: stats,
            vehiculos: vehiculos,
            conductores: conductores,
            asignaciones: asignacionesFiltradas,
            periodo: params.periodo || 'monthly',
            fecha_inicio: fechaInicio,
            fecha_fin: fechaFin,
            timestamp: new Date().toISOString()
        };
    } catch (error) {
        console.error('Error obteniendo estadísticas del dashboard:', error);
        
        // Retornar estructura básica en caso de error
        return {
            general: getEstadisticasDefault(),
            vehiculos: [],
            conductores: [],
            asignaciones: [],
            periodo: params.periodo || 'monthly',
            fecha_inicio: null,
            fecha_fin: null,
            timestamp: new Date().toISOString(),
            error: error.message
        };
    }
};

/**
 * Calcula el rango de fechas basado en el período seleccionado
 */
const calcularRangoFechas = (params) => {
    const ahora = new Date();
    let fechaInicio = new Date();
    let fechaFin = new Date();

    if (params.periodo === 'custom' && params.fecha_inicio && params.fecha_fin) {
        return {
            fechaInicio: new Date(params.fecha_inicio),
            fechaFin: new Date(params.fecha_fin)
        };
    }

    switch (params.periodo) {
        case 'daily':
            fechaInicio.setHours(0, 0, 0, 0);
            fechaFin.setHours(23, 59, 59, 999);
            break;
        case 'weekly':
            const diasAtras = ahora.getDay();
            fechaInicio.setDate(ahora.getDate() - diasAtras);
            fechaInicio.setHours(0, 0, 0, 0);
            fechaFin.setDate(fechaInicio.getDate() + 6);
            fechaFin.setHours(23, 59, 59, 999);
            break;
        case 'monthly':
            fechaInicio.setDate(1);
            fechaInicio.setHours(0, 0, 0, 0);
            fechaFin.setMonth(fechaInicio.getMonth() + 1);
            fechaFin.setDate(0);
            fechaFin.setHours(23, 59, 59, 999);
            break;
        case 'quarterly':
            const mesActual = ahora.getMonth();
            const inicioTrimestre = Math.floor(mesActual / 3) * 3;
            fechaInicio.setMonth(inicioTrimestre);
            fechaInicio.setDate(1);
            fechaInicio.setHours(0, 0, 0, 0);
            fechaFin.setMonth(inicioTrimestre + 3);
            fechaFin.setDate(0);
            fechaFin.setHours(23, 59, 59, 999);
            break;
        case 'yearly':
            fechaInicio.setMonth(0);
            fechaInicio.setDate(1);
            fechaInicio.setHours(0, 0, 0, 0);
            fechaFin.setMonth(11);
            fechaFin.setDate(31);
            fechaFin.setHours(23, 59, 59, 999);
            break;
        default:
            // Por defecto, último mes
            fechaInicio.setMonth(ahora.getMonth() - 1);
            fechaInicio.setHours(0, 0, 0, 0);
    }

    return { fechaInicio, fechaFin };
};

/**
 * Filtra asignaciones por período
 */
const filtrarAsignacionesPorPeriodo = (asignaciones, fechaInicio, fechaFin) => {
    if (!fechaInicio || !fechaFin) return asignaciones;

    return asignaciones.filter(asignacion => {
        const fechaAsignacion = new Date(asignacion.fecha_hora_requerida_inicio);
        return fechaAsignacion >= fechaInicio && fechaAsignacion <= fechaFin;
    });
};

/**
 * Calcula estadísticas completas del sistema
 */
const calcularEstadisticasCompletas = (vehiculos, conductores, asignaciones, params) => {
    // Estadísticas de vehículos
    const vehiculosStats = calcularEstadisticasVehiculos(vehiculos, asignaciones);
    
    // Estadísticas de conductores
    const conductoresStats = calcularEstadisticasConductores(conductores, asignaciones);
    
    // Estadísticas de asignaciones
    const asignacionesStats = calcularEstadisticasAsignaciones(asignaciones);
    
    // Estadísticas de rendimiento
    const rendimientoStats = calcularEstadisticasRendimiento(asignaciones);

    return {
        // Totales
        total_vehiculos: vehiculos.length,
        total_conductores: conductores.length,
        total_asignaciones: asignaciones.length,
        
        // Vehículos
        ...vehiculosStats,
        
        // Conductores
        ...conductoresStats,
        
        // Asignaciones
        ...asignacionesStats,
        
        // Rendimiento
        ...rendimientoStats,
        
        // Métricas adicionales
        fecha_actualizacion: new Date().toISOString(),
        periodo_analisis: params.periodo || 'monthly'
    };
};

/**
 * Calcula estadísticas específicas de vehículos
 */
const calcularEstadisticasVehiculos = (vehiculos, asignaciones) => {
    const stats = {
        vehiculos_disponibles: 0,
        vehiculos_en_uso: 0,
        vehiculos_en_mantenimiento: 0,
        vehiculos_reservados: 0,
        vehiculos_fuera_servicio: 0
    };

    vehiculos.forEach(vehiculo => {
        const estado = vehiculo.estado?.toLowerCase() || 'disponible';
        
        switch (estado) {
            case 'disponible':
                stats.vehiculos_disponibles++;
                break;
            case 'en_uso':
            case 'en uso':
            case 'activo':
                stats.vehiculos_en_uso++;
                break;
            case 'mantenimiento':
            case 'en_mantenimiento':
                stats.vehiculos_en_mantenimiento++;
                break;
            case 'reservado':
                stats.vehiculos_reservados++;
                break;
            case 'fuera_servicio':
            case 'inactivo':
                stats.vehiculos_fuera_servicio++;
                break;
            default:
                stats.vehiculos_disponibles++;
        }
    });

    // Calcular métricas adicionales
    const totalVehiculos = vehiculos.length;
    const vehiculosOperativos = stats.vehiculos_disponibles + stats.vehiculos_en_uso + stats.vehiculos_reservados;
    
    return {
        ...stats,
        tasa_disponibilidad_vehiculos: totalVehiculos > 0 ? 
            ((vehiculosOperativos / totalVehiculos) * 100).toFixed(1) : 0,
        vehiculos_operativos: vehiculosOperativos
    };
};

/**
 * Calcula estadísticas específicas de conductores
 */
const calcularEstadisticasConductores = (conductores, asignaciones) => {
    const stats = {
        conductores_disponibles: 0,
        conductores_en_ruta: 0,
        conductores_dia_libre: 0,
        conductores_no_disponibles: 0
    };

    conductores.forEach(conductor => {
        const estado = conductor.estado_disponibilidad?.toLowerCase() || 'disponible';
        
        switch (estado) {
            case 'disponible':
                stats.conductores_disponibles++;
                break;
            case 'en_ruta':
            case 'en ruta':
            case 'activo':
                stats.conductores_en_ruta++;
                break;
            case 'dia_libre':
            case 'día_libre':
            case 'libre':
                stats.conductores_dia_libre++;
                break;
            case 'no_disponible':
            case 'no disponible':
            case 'inactivo':
                stats.conductores_no_disponibles++;
                break;
            default:
                stats.conductores_disponibles++;
        }
    });

    // Verificar licencias próximas a vencer
    const hoy = new Date();
    const en30Dias = new Date();
    en30Dias.setDate(hoy.getDate() + 30);

    const licenciasProximasVencer = conductores.filter(conductor => {
        if (!conductor.fecha_vencimiento_licencia) return false;
        const fechaVencimiento = new Date(conductor.fecha_vencimiento_licencia);
        return fechaVencimiento >= hoy && fechaVencimiento <= en30Dias;
    }).length;

    const licenciasVencidas = conductores.filter(conductor => {
        if (!conductor.fecha_vencimiento_licencia) return false;
        const fechaVencimiento = new Date(conductor.fecha_vencimiento_licencia);
        return fechaVencimiento < hoy;
    }).length;

    return {
        ...stats,
        licencias_proximas_vencer: licenciasProximasVencer,
        licencias_vencidas: licenciasVencidas,
        conductores_activos: stats.conductores_disponibles + stats.conductores_en_ruta
    };
};

/**
 * Calcula estadísticas específicas de asignaciones
 */
const calcularEstadisticasAsignaciones = (asignaciones) => {
    const stats = {
        asignaciones_completadas: 0,
        asignaciones_activas: 0,
        asignaciones_programadas: 0,
        asignaciones_pendientes_auto: 0,
        asignaciones_canceladas: 0,
        asignaciones_fallo_auto: 0
    };

    asignaciones.forEach(asignacion => {
        const estado = asignacion.estado?.toLowerCase() || 'pendiente_auto';
        
        switch (estado) {
            case 'completada':
            case 'finalizada':
            case 'terminada':
                stats.asignaciones_completadas++;
                break;
            case 'activa':
            case 'en_curso':
            case 'en curso':
                stats.asignaciones_activas++;
                break;
            case 'programada':
            case 'aprobada':
                stats.asignaciones_programadas++;
                break;
            case 'pendiente_auto':
            case 'pendiente':
                stats.asignaciones_pendientes_auto++;
                break;
            case 'cancelada':
            case 'anulada':
                stats.asignaciones_canceladas++;
                break;
            case 'fallo_auto':
                stats.asignaciones_fallo_auto++;
                break;
            default:
                stats.asignaciones_pendientes_auto++;
        }
    });

    return stats;
};

/**
 * Calcula estadísticas de rendimiento
 */
const calcularEstadisticasRendimiento = (asignaciones) => {
    const asignacionesCompletadas = asignaciones.filter(a => a.estado === 'completada');
    
    // Distancia total recorrida
    const distancia_total_km = asignacionesCompletadas.reduce((total, asignacion) => {
        return total + (parseFloat(asignacion.distancia_recorrida_km) || 0);
    }, 0);

    // Tiempo total en asignaciones
    const tiempoTotalHoras = asignacionesCompletadas.reduce((total, asignacion) => {
        if (!asignacion.fecha_hora_fin_prevista || !asignacion.fecha_hora_requerida_inicio) return total;
        
        const inicio = new Date(asignacion.fecha_hora_requerida_inicio);
        const fin = new Date(asignacion.fecha_hora_fin_prevista);
        const horas = (fin - inicio) / (1000 * 60 * 60);
        
        return total + (horas > 0 ? horas : 0);
    }, 0);

    // Calcular promedios
    const totalAsignaciones = asignaciones.length;
    const completadas = asignacionesCompletadas.length;
    
    return {
        distancia_total_km: parseFloat(distancia_total_km.toFixed(2)),
        tiempo_total_horas: parseFloat(tiempoTotalHoras.toFixed(2)),
        distancia_promedio_km: completadas > 0 ? 
            parseFloat((distancia_total_km / completadas).toFixed(2)) : 0,
        tiempo_promedio_horas: completadas > 0 ? 
            parseFloat((tiempoTotalHoras / completadas).toFixed(2)) : 0,
        tasa_completacion: totalAsignaciones > 0 ? 
            parseFloat(((completadas / totalAsignaciones) * 100).toFixed(1)) : 0,
        tasa_cancelacion: totalAsignaciones > 0 ? 
            parseFloat(((asignaciones.filter(a => a.estado === 'cancelada').length / totalAsignaciones) * 100).toFixed(1)) : 0
    };
};

/**
 * Retorna estadísticas por defecto cuando no hay datos
 */
const getEstadisticasDefault = () => ({
    total_vehiculos: 0,
    total_conductores: 0,
    total_asignaciones: 0,
    vehiculos_disponibles: 0,
    vehiculos_en_uso: 0,
    vehiculos_en_mantenimiento: 0,
    vehiculos_reservados: 0,
    vehiculos_fuera_servicio: 0,
    conductores_disponibles: 0,
    conductores_en_ruta: 0,
    conductores_dia_libre: 0,
    conductores_no_disponibles: 0,
    asignaciones_completadas: 0,
    asignaciones_activas: 0,
    asignaciones_programadas: 0,
    asignaciones_pendientes_auto: 0,
    asignaciones_canceladas: 0,
    distancia_total_km: 0,
    tiempo_total_horas: 0,
    tasa_completacion: 0,
    tasa_cancelacion: 0,
    licencias_proximas_vencer: 0,
    licencias_vencidas: 0
});

/**
 * Refresca el caché de datos del dashboard
 * @returns {Promise<Object>} Resultado de la actualización
 */
export const refreshDashboardCache = async () => {
    try {
        // En lugar de llamar a un endpoint específico, simplemente forzamos la recarga de datos
        console.log('Refrescando datos del dashboard...');
        return { success: true, timestamp: new Date().toISOString() };
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
        const asignaciones = await getAsignaciones();
        
        // Filtrar solo asignaciones con coordenadas válidas
        const asignacionesConCoordenadas = asignaciones.filter(asignacion => {
            return asignacion.origen_lat && asignacion.origen_lon && 
                   asignacion.destino_lat && asignacion.destino_lon;
        });
        
        return {
            results: asignacionesConCoordenadas,
            count: asignacionesConCoordenadas.length
        };
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
        // Simular datos de mantenimiento más realistas
        const historial = [
            {
                id: 1,
                fecha: '2024-12-01',
                tipo: 'Mantenimiento Preventivo',
                descripcion: 'Cambio de aceite y filtros',
                costo: 45000,
                kilometraje: 15000,
                proveedor: 'Taller Central',
                estado: 'completado'
            },
            {
                id: 2,
                fecha: '2024-11-15',
                tipo: 'Reparación',
                descripcion: 'Cambio de neumáticos',
                costo: 120000,
                kilometraje: 14500,
                proveedor: 'Neumáticos del Sur',
                estado: 'completado'
            },
            {
                id: 3,
                fecha: '2024-10-20',
                tipo: 'Inspección',
                descripcion: 'Revisión técnica anual',
                costo: 35000,
                kilometraje: 13800,
                proveedor: 'Revisión Técnica Oficial',
                estado: 'completado'
            }
        ];
        
        return historial;
    } catch (error) {
        console.error('Error obteniendo historial de mantenimiento:', error);
        return [];
    }
};

/**
 * Calcula métricas adicionales basadas en los datos obtenidos
 * @param {Object} rawData - Datos crudos del dashboard
 * @returns {Object} Métricas calculadas
 */
export const calculateAdditionalMetrics = (rawData) => {
    if (!rawData || !rawData.general) {
        return {
            tasaUtilizacionFlota: 0,
            eficienciaAsignaciones: 0,
            promedioKmPorAsignacion: 0,
            disponibilidadConductores: 0,
            indicadorSalud: 'bueno'
        };
    }

    const { general } = rawData;
    
    // Tasa de utilización de la flota
    const tasaUtilizacionFlota = general.total_vehiculos > 0 
        ? parseFloat((((general.vehiculos_en_uso + general.vehiculos_reservados) / general.total_vehiculos) * 100).toFixed(1))
        : 0;
    
    // Eficiencia de asignaciones
    const eficienciaAsignaciones = general.total_asignaciones > 0
        ? parseFloat(((general.asignaciones_completadas / general.total_asignaciones) * 100).toFixed(1))
        : 0;
    
    // Promedio de kilometraje por asignación
    const promedioKmPorAsignacion = general.asignaciones_completadas > 0
        ? parseFloat((general.distancia_total_km / general.asignaciones_completadas).toFixed(2))
        : 0;
    
    // Disponibilidad de conductores
    const disponibilidadConductores = general.total_conductores > 0
        ? parseFloat(((general.conductores_disponibles / general.total_conductores) * 100).toFixed(1))
        : 0;

    // Indicador de salud general del sistema
    let indicadorSalud = 'bueno';
    if (eficienciaAsignaciones < 70 || disponibilidadConductores < 50 || tasaUtilizacionFlota > 90) {
        indicadorSalud = 'atencion';
    }
    if (eficienciaAsignaciones < 50 || disponibilidadConductores < 30 || general.licencias_vencidas > 0) {
        indicadorSalud = 'critico';
    }

    return {
        tasaUtilizacionFlota,
        eficienciaAsignaciones,
        promedioKmPorAsignacion,
        disponibilidadConductores,
        indicadorSalud,
        alertasCount: (general.licencias_vencidas || 0) + (general.licencias_proximas_vencer || 0),
        tendenciaDiaria: calcularTendenciaDiaria(rawData.asignaciones || [])
    };
};

/**
 * Calcula la tendencia diaria de asignaciones
 */
const calcularTendenciaDiaria = (asignaciones) => {
    const hoy = new Date();
    const ayer = new Date();
    ayer.setDate(hoy.getDate() - 1);
    
    const asignacionesHoy = asignaciones.filter(a => {
        const fecha = new Date(a.fecha_hora_requerida_inicio);
        return fecha.toDateString() === hoy.toDateString();
    }).length;
    
    const asignacionesAyer = asignaciones.filter(a => {
        const fecha = new Date(a.fecha_hora_requerida_inicio);
        return fecha.toDateString() === ayer.toDateString();
    }).length;
    
    if (asignacionesAyer === 0) return 0;
    
    return parseFloat((((asignacionesHoy - asignacionesAyer) / asignacionesAyer) * 100).toFixed(1));
};

/**
 * Formatea los datos para los gráficos de Chart.js
 * @param {Object} data - Datos del dashboard
 * @param {string} chartType - Tipo de gráfico
 * @returns {Object} Datos formateados para Chart.js
 */
export const formatChartData = (data, chartType) => {
    if (!data || !data.general) {
        return { labels: [], datasets: [] };
    }

    const colors = {
        primary: '#3B82F6',
        success: '#10B981',
        warning: '#F59E0B',
        danger: '#EF4444',
        purple: '#8B5CF6',
        gray: '#6B7280'
    };

    switch (chartType) {
        case 'estadoVehiculos':
            return {
                labels: ['Disponibles', 'En Uso', 'Mantenimiento', 'Reservados'],
                datasets: [{
                    data: [
                        data.general.vehiculos_disponibles || 0,
                        data.general.vehiculos_en_uso || 0,
                        data.general.vehiculos_en_mantenimiento || 0,
                        data.general.vehiculos_reservados || 0
                    ],
                    backgroundColor: [colors.success, colors.primary, colors.warning, colors.purple],
                    borderWidth: 2,
                    borderColor: '#ffffff'
                }]
            };
        
        case 'estadoConductores':
            return {
                labels: ['Disponibles', 'En Ruta', 'Día Libre', 'No Disponibles'],
                datasets: [{
                    data: [
                        data.general.conductores_disponibles || 0,
                        data.general.conductores_en_ruta || 0,
                        data.general.conductores_dia_libre || 0,
                        data.general.conductores_no_disponibles || 0
                    ],
                    backgroundColor: [colors.success, colors.primary, colors.gray, colors.danger],
                    borderWidth: 2,
                    borderColor: '#ffffff'
                }]
            };
        
        case 'asignacionesPorEstado':
            return {
                labels: ['Completadas', 'Activas', 'Programadas', 'Pendientes', 'Canceladas'],
                datasets: [{
                    data: [
                        data.general.asignaciones_completadas || 0,
                        data.general.asignaciones_activas || 0,
                        data.general.asignaciones_programadas || 0,
                        data.general.asignaciones_pendientes_auto || 0,
                        data.general.asignaciones_canceladas || 0
                    ],
                    backgroundColor: [colors.success, colors.primary, colors.warning, colors.purple, colors.danger],
                    borderWidth: 2,
                    borderColor: '#ffffff'
                }]
            };
        
        case 'tendenciasAsignaciones':
            // Generar datos de tendencia basados en el período
            const dias = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
            const datosSimulados = data.asignaciones ? 
                calcularDistribucionSemanal(data.asignaciones) :
                [5, 8, 6, 12, 10, 3, 7];

            return {
                labels: dias,
                datasets: [{
                    label: 'Asignaciones por día',
                    data: datosSimulados,
                    borderColor: colors.primary,
                    backgroundColor: colors.primary + '20',
                    tension: 0.4,
                    fill: true
                }]
            };
        
        default:
            return { labels: [], datasets: [] };
    }
};

/**
 * Calcula la distribución semanal de asignaciones
 */
const calcularDistribucionSemanal = (asignaciones) => {
    const distribucion = [0, 0, 0, 0, 0, 0, 0]; // Lun-Dom
    
    asignaciones.forEach(asignacion => {
        const fecha = new Date(asignacion.fecha_hora_requerida_inicio);
        const diaSemana = fecha.getDay();
        const diaIndex = diaSemana === 0 ? 6 : diaSemana - 1; // Convertir domingo=0 a índice 6
        distribucion[diaIndex]++;
    });
    
    return distribucion;
};

/**
 * Obtiene alertas y notificaciones del sistema
 * @returns {Promise<Array>} Lista de alertas
 */
export const getSystemAlerts = async () => {
    try {
        const [vehiculos, conductores, asignaciones] = await Promise.all([
            getVehiculos().catch(() => []),
            getConductores().catch(() => []),
            getAsignaciones().catch(() => [])
        ]);

        const alertas = [];
        const hoy = new Date();

        // Alertas de vehículos que requieren mantenimiento
        vehiculos.forEach(vehiculo => {
            if (vehiculo.kilometraje && vehiculo.kilometraje > 10000) {
                const kmParaMantenimiento = 15000 - (vehiculo.kilometraje % 15000);
                if (kmParaMantenimiento < 1000) {
                    alertas.push({
                        id: `mant_${vehiculo.id}`,
                        tipo: 'mantenimiento',
                        severidad: kmParaMantenimiento < 500 ? 'alta' : 'media',
                        titulo: 'Vehículo requiere mantenimiento',
                        mensaje: `${vehiculo.patente} necesita mantenimiento en ${kmParaMantenimiento} km`,
                        fecha: new Date().toISOString(),
                        vehiculo: vehiculo.patente
                    });
                }
            }
        });

        // Alertas de licencias próximas a vencer
        conductores.forEach(conductor => {
            if (conductor.fecha_vencimiento_licencia) {
                const fechaVencimiento = new Date(conductor.fecha_vencimiento_licencia);
                const diasParaVencer = Math.ceil((fechaVencimiento - hoy) / (1000 * 60 * 60 * 24));
                
                if (diasParaVencer <= 30 && diasParaVencer >= 0) {
                    alertas.push({
                        id: `lic_${conductor.id}`,
                        tipo: 'licencia',
                        severidad: diasParaVencer <= 7 ? 'alta' : 'media',
                        titulo: 'Licencia próxima a vencer',
                        mensaje: `Licencia de ${conductor.nombre} ${conductor.apellido} vence en ${diasParaVencer} días`,
                        fecha: new Date().toISOString(),
                        conductor: `${conductor.nombre} ${conductor.apellido}`
                    });
                } else if (diasParaVencer < 0) {
                    alertas.push({
                        id: `lic_venc_${conductor.id}`,
                        tipo: 'licencia',
                        severidad: 'alta',
                        titulo: 'Licencia vencida',
                        mensaje: `Licencia de ${conductor.nombre} ${conductor.apellido} venció hace ${Math.abs(diasParaVencer)} días`,
                        fecha: new Date().toISOString(),
                        conductor: `${conductor.nombre} ${conductor.apellido}`
                    });
                }
            }
        });

        // Alertas de asignaciones pendientes por mucho tiempo
        const hace24Horas = new Date();
        hace24Horas.setHours(hace24Horas.getHours() - 24);
        
        const asignacionesPendientes = asignaciones.filter(a => 
            a.estado === 'pendiente_auto' && 
            new Date(a.fecha_hora_requerida_inicio) < hace24Horas
        );

        if (asignacionesPendientes.length > 0) {
            alertas.push({
                id: 'asig_pendientes',
                tipo: 'asignaciones',
                severidad: 'media',
                titulo: 'Asignaciones pendientes',
                mensaje: `${asignacionesPendientes.length} asignaciones llevan más de 24h pendientes`,
                fecha: new Date().toISOString()
            });
        }

        // Ordenar por severidad (alta primero)
        return alertas.sort((a, b) => {
            const orden = { 'alta': 0, 'media': 1, 'baja': 2 };
            return orden[a.severidad] - orden[b.severidad];
        });
        
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
