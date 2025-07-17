// src/components/dashboard/VistaGeneral/index.js
import { h } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, LineElement, PointElement, LinearScale, CategoryScale, BarElement, TimeScale } from 'chart.js';
import { Pie, Line, Bar, Doughnut } from 'react-chartjs-2';
import 'chartjs-adapter-date-fns';
import { formatChartData, getSystemAlerts, calculateAdditionalMetrics } from '../../../services/dashboardService';
import { getVehiculos } from '../../../services/vehicleService';
import { getConductores } from '../../../services/conductorService';
import { getAsignaciones } from '../../../services/asignacionService';
import MetricCard from '../MetricCard';
import AlertasList from '../AlertasList';
import style from './style.css';

// Registrar componentes de Chart.js
ChartJS.register(ArcElement, Tooltip, Legend, LineElement, PointElement, LinearScale, CategoryScale, BarElement, TimeScale);

const VistaGeneral = ({ data, loading }) => {
    const [alertas, setAlertas] = useState([]);
    const [vehiculosData, setVehiculosData] = useState([]);
    const [conductoresData, setConductoresData] = useState([]);
    const [asignacionesData, setAsignacionesData] = useState([]);
    const [loadingData, setLoadingData] = useState(true);
    const [metricas, setMetricas] = useState({});
    const [vistaActiva, setVistaActiva] = useState('resumen');

    useEffect(() => {
        const cargarDatosAdicionales = async () => {
            try {
                setLoadingData(true);
                const [vehiculos, conductores, asignaciones, alertasData] = await Promise.all([
                    getVehiculos().catch(() => []),
                    getConductores().catch(() => []),
                    getAsignaciones().catch(() => []),
                    getSystemAlerts().catch(() => [])
                ]);
                
                setVehiculosData(vehiculos);
                setConductoresData(conductores);
                setAsignacionesData(asignaciones);
                setAlertas(alertasData);

                // Calcular métricas adicionales
                const datosParaMetricas = {
                    general: {
                        total_vehiculos: vehiculos.length,
                        total_conductores: conductores.length,
                        total_asignaciones: asignaciones.length,
                        vehiculos_disponibles: vehiculos.filter(v => v.estado === 'disponible').length,
                        vehiculos_en_uso: vehiculos.filter(v => v.estado === 'en_uso').length,
                        conductores_disponibles: conductores.filter(c => c.estado_disponibilidad === 'disponible').length,
                        asignaciones_completadas: asignaciones.filter(a => a.estado === 'completada').length,
                        distancia_total_km: asignaciones
                            .filter(a => a.estado === 'completada')
                            .reduce((sum, a) => sum + (parseFloat(a.distancia_recorrida_km) || 0), 0)
                    },
                    vehiculos,
                    conductores,
                    asignaciones
                };
                
                const metricasCalculadas = calculateAdditionalMetrics(datosParaMetricas);
                setMetricas(metricasCalculadas);
                
            } catch (error) {
                console.error('Error cargando datos adicionales:', error);
            } finally {
                setLoadingData(false);
            }
        };

        cargarDatosAdicionales();
    }, []);

    // Calcular métricas en tiempo real de los datos obtenidos
    const calcularEstadisticas = () => {
        if (!vehiculosData.length && !conductoresData.length && !asignacionesData.length) {
            return {
                vehiculosDisponibles: 0,
                vehiculosEnUso: 0,
                vehiculosMantenimiento: 0,
                vehiculosReservados: 0,
                conductoresDisponibles: 0,
                conductoresEnRuta: 0,
                asignacionesCompletadas: 0,
                asignacionesActivas: 0,
                asignacionesProgramadas: 0,
                asignacionesCanceladas: 0,
                tasaUtilizacion: 0,
                eficienciaAsignaciones: 0,
                kmTotales: 0
            };
        }

        const vehiculosDisponibles = vehiculosData.filter(v => v.estado === 'disponible').length;
        const vehiculosEnUso = vehiculosData.filter(v => v.estado === 'en_uso' || v.estado === 'activo').length;
        const vehiculosMantenimiento = vehiculosData.filter(v => v.estado === 'mantenimiento').length;
        const vehiculosReservados = vehiculosData.filter(v => v.estado === 'reservado').length;

        const conductoresDisponibles = conductoresData.filter(c => c.estado_disponibilidad === 'disponible').length;
        const conductoresEnRuta = conductoresData.filter(c => c.estado_disponibilidad === 'en_ruta').length;

        const asignacionesCompletadas = asignacionesData.filter(a => a.estado === 'completada').length;
        const asignacionesActivas = asignacionesData.filter(a => a.estado === 'activa').length;
        const asignacionesProgramadas = asignacionesData.filter(a => a.estado === 'programada').length;
        const asignacionesCanceladas = asignacionesData.filter(a => a.estado === 'cancelada').length;

        const tasaUtilizacion = vehiculosData.length > 0 
            ? ((vehiculosEnUso + vehiculosReservados) / vehiculosData.length * 100).toFixed(1)
            : 0;

        const eficienciaAsignaciones = asignacionesData.length > 0
            ? (asignacionesCompletadas / asignacionesData.length * 100).toFixed(1)
            : 0;

        const kmTotales = asignacionesData
            .filter(a => a.estado === 'completada')
            .reduce((sum, a) => sum + (parseFloat(a.distancia_recorrida_km) || 0), 0)
            .toFixed(1);

        return {
            vehiculosDisponibles,
            vehiculosEnUso,
            vehiculosMantenimiento,
            vehiculosReservados,
            conductoresDisponibles,
            conductoresEnRuta,
            asignacionesCompletadas,
            asignacionesActivas,
            asignacionesProgramadas,
            asignacionesCanceladas,
            tasaUtilizacion: parseFloat(tasaUtilizacion),
            eficienciaAsignaciones: parseFloat(eficienciaAsignaciones),
            kmTotales: parseFloat(kmTotales)
        };
    };

    const stats = calcularEstadisticas();

    // Datos para gráficos mejorados
    const chartDataVehiculos = {
        labels: ['Disponibles', 'En Uso', 'Mantenimiento', 'Reservados'],
        datasets: [{
            data: [stats.vehiculosDisponibles, stats.vehiculosEnUso, stats.vehiculosMantenimiento, stats.vehiculosReservados],
            backgroundColor: [
                '#10B981', // Verde - Disponibles
                '#3B82F6', // Azul - En Uso  
                '#F59E0B', // Amarillo - Mantenimiento
                '#8B5CF6'  // Púrpura - Reservados
            ],
            borderWidth: 3,
            borderColor: '#ffffff',
            hoverBorderWidth: 4,
            hoverOffset: 8
        }]
    };

    const chartDataConductores = {
        labels: ['Disponibles', 'En Ruta', 'Día Libre', 'No Disponibles'],
        datasets: [{
            data: [
                stats.conductoresDisponibles,
                stats.conductoresEnRuta,
                conductoresData.filter(c => c.estado_disponibilidad === 'dia_libre').length,
                conductoresData.filter(c => c.estado_disponibilidad === 'no_disponible').length
            ],
            backgroundColor: [
                '#10B981', // Verde - Disponibles
                '#3B82F6', // Azul - En Ruta
                '#6B7280', // Gris - Día Libre
                '#EF4444'  // Rojo - No Disponibles
            ],
            borderWidth: 3,
            borderColor: '#ffffff',
            hoverBorderWidth: 4,
            hoverOffset: 8
        }]
    };

    const chartDataAsignaciones = {
        labels: ['Completadas', 'Activas', 'Programadas', 'Canceladas'],
        datasets: [{
            data: [stats.asignacionesCompletadas, stats.asignacionesActivas, stats.asignacionesProgramadas, stats.asignacionesCanceladas],
            backgroundColor: [
                '#10B981', // Verde - Completadas
                '#3B82F6', // Azul - Activas
                '#F59E0B', // Amarillo - Programadas
                '#EF4444'  // Rojo - Canceladas
            ],
            borderWidth: 3,
            borderColor: '#ffffff',
            hoverBorderWidth: 4,
            hoverOffset: 8
        }]
    };

    // Datos de tendencias mejorados
    const calcularTendenciasSemana = () => {
        const dias = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
        const asignacionesPorDia = new Array(7).fill(0);
        const kmPorDia = new Array(7).fill(0);

        asignacionesData.forEach(asignacion => {
            const fecha = new Date(asignacion.fecha_hora_requerida_inicio);
            const diaSemana = fecha.getDay();
            const diaIndex = diaSemana === 0 ? 6 : diaSemana - 1; // Domingo = 6

            asignacionesPorDia[diaIndex]++;
            if (asignacion.estado === 'completada' && asignacion.distancia_recorrida_km) {
                kmPorDia[diaIndex] += parseFloat(asignacion.distancia_recorrida_km);
            }
        });

        return {
            labels: dias,
            datasets: [
                {
                    label: 'Asignaciones',
                    data: asignacionesPorDia,
                    borderColor: '#3B82F6',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    tension: 0.4,
                    fill: true,
                    pointBackgroundColor: '#3B82F6',
                    pointBorderColor: '#ffffff',
                    pointBorderWidth: 2,
                    pointRadius: 6,
                    pointHoverRadius: 8
                },
                {
                    label: 'Km Recorridos',
                    data: kmPorDia,
                    borderColor: '#10B981',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    tension: 0.4,
                    fill: false,
                    pointBackgroundColor: '#10B981',
                    pointBorderColor: '#ffffff',
                    pointBorderWidth: 2,
                    pointRadius: 6,
                    pointHoverRadius: 8,
                    yAxisID: 'y1'
                }
            ]
        };
    };

    const datosTendencias = calcularTendenciasSemana();

    const opcionesTendencias = {
        responsive: true,
        interaction: {
            mode: 'index',
            intersect: false,
        },
        plugins: {
            legend: {
                position: 'top',
                labels: {
                    usePointStyle: true,
                    padding: 20,
                    font: {
                        weight: 600
                    }
                }
            },
            title: {
                display: true,
                text: 'Tendencias Semanales de Actividad',
                font: {
                    size: 16,
                    weight: 700
                },
                color: '#1e293b'
            },
            tooltip: {
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                titleColor: '#1e293b',
                bodyColor: '#374151',
                borderColor: '#e5e7eb',
                borderWidth: 1,
                cornerRadius: 8,
                displayColors: true,
                titleFont: {
                    weight: 600
                }
            }
        },
        scales: {
            y: {
                type: 'linear',
                display: true,
                position: 'left',
                title: {
                    display: true,
                    text: 'Número de Asignaciones',
                    font: {
                        weight: 600
                    }
                },
                grid: {
                    color: 'rgba(0, 0, 0, 0.05)'
                },
                ticks: {
                    stepSize: 1
                }
            },
            y1: {
                type: 'linear',
                display: true,
                position: 'right',
                title: {
                    display: true,
                    text: 'Kilómetros Recorridos',
                    font: {
                        weight: 600
                    }
                },
                grid: {
                    drawOnChartArea: false,
                },
            },
            x: {
                grid: {
                    color: 'rgba(0, 0, 0, 0.05)'
                },
                ticks: {
                    font: {
                        weight: 500
                    }
                }
            }
        }
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'bottom',
                labels: {
                    usePointStyle: true,
                    padding: 20,
                    font: {
                        weight: 600
                    }
                }
            },
            tooltip: {
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                titleColor: '#1e293b',
                bodyColor: '#374151',
                borderColor: '#e5e7eb',
                borderWidth: 1,
                cornerRadius: 8,
                displayColors: true,
                titleFont: {
                    weight: 600
                }
            }
        }
    };

    if (loading || loadingData) {
        return (
            <div className={style.loadingContainer}>
                <div className={style.spinner}></div>
                <p>Cargando vista general del sistema...</p>
            </div>
        );
    }

    const renderVistaResumen = () => (
        <>
            {/* Métricas principales */}
            <div className={style.metricsGrid}>
                <MetricCard
                    title="Flota Total"
                    value={vehiculosData.length}
                    subtitle={`${stats.tasaUtilizacion}% en uso`}
                    icon="🚗"
                    trend={{ 
                        value: stats.tasaUtilizacion >= 70 ? 'Alto uso' : stats.tasaUtilizacion >= 40 ? 'Uso moderado' : 'Bajo uso', 
                        direction: stats.tasaUtilizacion >= 70 ? 'up' : 'down' 
                    }}
                    color={stats.tasaUtilizacion >= 70 ? "orange" : stats.tasaUtilizacion >= 40 ? "blue" : "green"}
                />
                
                <MetricCard
                    title="Conductores Activos"
                    value={stats.conductoresDisponibles + stats.conductoresEnRuta}
                    subtitle={`${conductoresData.length} total registrados`}
                    icon="👨‍💼"
                    trend={{ 
                        value: `${((stats.conductoresDisponibles + stats.conductoresEnRuta) / Math.max(conductoresData.length, 1) * 100).toFixed(0)}% activos`,
                        direction: 'up' 
                    }}
                    color="green"
                />
                
                <MetricCard
                    title="Asignaciones Hoy"
                    value={asignacionesData.length}
                    subtitle={`${stats.eficienciaAsignaciones}% completadas`}
                    icon="📋"
                    trend={{ 
                        value: metricas.tendenciaDiaria > 0 ? `+${metricas.tendenciaDiaria}%` : `${metricas.tendenciaDiaria}%`,
                        direction: metricas.tendenciaDiaria >= 0 ? 'up' : 'down' 
                    }}
                    color="purple"
                />
                
                <MetricCard
                    title="Distancia Total"
                    value={`${stats.kmTotales} km`}
                    subtitle={metricas.promedioKmPorAsignacion ? `Promedio: ${metricas.promedioKmPorAsignacion} km/viaje` : 'Sin datos'}
                    icon="🛣️"
                    trend={{ 
                        value: stats.kmTotales > 1000 ? 'Alto volumen' : 'Volumen normal',
                        direction: 'up' 
                    }}
                    color="orange"
                />
            </div>

            {/* Gráficos principales */}
            <div className={style.chartsGrid}>
                <div className={style.chartCard}>
                    <h3>🚗 Estado de la Flota</h3>
                    <div className={style.chartContainer}>
                        <Doughnut data={chartDataVehiculos} options={chartOptions} />
                    </div>
                </div>

                <div className={style.chartCard}>
                    <h3>👨‍💼 Estado de Conductores</h3>
                    <div className={style.chartContainer}>
                        <Doughnut data={chartDataConductores} options={chartOptions} />
                    </div>
                </div>

                <div className={style.chartCard}>
                    <h3>📋 Estado de Asignaciones</h3>
                    <div className={style.chartContainer}>
                        <Doughnut data={chartDataAsignaciones} options={chartOptions} />
                    </div>
                </div>

                <div className={`${style.chartCard} ${style.wideChart}`}>
                    <h3>📈 Tendencias de Actividad Semanal</h3>
                    <div className={style.chartContainer}>
                        <Line data={datosTendencias} options={opcionesTendencias} />
                    </div>
                </div>
            </div>
        </>
    );

    const renderVistaIndicadores = () => (
        <div className={style.indicadoresGrid}>
            {/* KPIs Principales */}
            <div className={style.kpiCard}>
                <h3>🎯 Indicadores Clave de Rendimiento</h3>
                <div className={style.kpiList}>
                    <div className={style.kpiItem}>
                        <div className={style.kpiHeader}>
                            <span className={style.kpiLabel}>Tasa de Utilización de Flota</span>
                            <span className={`${style.kpiValue} ${stats.tasaUtilizacion >= 70 ? style.warning : stats.tasaUtilizacion >= 40 ? style.good : style.excellent}`}>
                                {stats.tasaUtilizacion}%
                            </span>
                        </div>
                        <div className={style.kpiBar}>
                            <div className={style.kpiProgress} style={{ width: `${stats.tasaUtilizacion}%` }}></div>
                        </div>
                        <small className={style.kpiDescription}>
                            {stats.tasaUtilizacion >= 70 ? 'Alta utilización - Considerar ampliar flota' : 
                             stats.tasaUtilizacion >= 40 ? 'Utilización óptima' : 'Baja utilización - Oportunidad de optimización'}
                        </small>
                    </div>
                    
                    <div className={style.kpiItem}>
                        <div className={style.kpiHeader}>
                            <span className={style.kpiLabel}>Eficiencia de Asignaciones</span>
                            <span className={`${style.kpiValue} ${stats.eficienciaAsignaciones >= 85 ? style.excellent : stats.eficienciaAsignaciones >= 70 ? style.good : style.warning}`}>
                                {stats.eficienciaAsignaciones}%
                            </span>
                        </div>
                        <div className={style.kpiBar}>
                            <div className={style.kpiProgress} style={{ width: `${stats.eficienciaAsignaciones}%` }}></div>
                        </div>
                        <small className={style.kpiDescription}>
                            {stats.eficienciaAsignaciones >= 85 ? 'Excelente eficiencia operativa' : 
                             stats.eficienciaAsignaciones >= 70 ? 'Buena eficiencia' : 'Requiere mejoras en el proceso'}
                        </small>
                    </div>

                    <div className={style.kpiItem}>
                        <div className={style.kpiHeader}>
                            <span className={style.kpiLabel}>Disponibilidad de Conductores</span>
                            <span className={`${style.kpiValue} ${metricas.disponibilidadConductores >= 60 ? style.excellent : metricas.disponibilidadConductores >= 40 ? style.good : style.warning}`}>
                                {metricas.disponibilidadConductores || 0}%
                            </span>
                        </div>
                        <div className={style.kpiBar}>
                            <div className={style.kpiProgress} style={{ width: `${metricas.disponibilidadConductores || 0}%` }}></div>
                        </div>
                        <small className={style.kpiDescription}>
                            {(metricas.disponibilidadConductores || 0) >= 60 ? 'Excelente disponibilidad' : 
                             (metricas.disponibilidadConductores || 0) >= 40 ? 'Disponibilidad adecuada' : 'Baja disponibilidad - Revisar turnos'}
                        </small>
                    </div>
                </div>
            </div>

            {/* Estado del Sistema */}
            <div className={style.systemHealthCard}>
                <h3>🏥 Estado General del Sistema</h3>
                <div className={style.healthIndicator}>
                    <div className={`${style.healthStatus} ${style[metricas.indicadorSalud || 'bueno']}`}>
                        <span className={style.healthIcon}>
                            {metricas.indicadorSalud === 'critico' ? '🔴' : 
                             metricas.indicadorSalud === 'atencion' ? '🟡' : '🟢'}
                        </span>
                        <span className={style.healthText}>
                            {metricas.indicadorSalud === 'critico' ? 'Estado Crítico' : 
                             metricas.indicadorSalud === 'atencion' ? 'Requiere Atención' : 'Estado Óptimo'}
                        </span>
                    </div>
                    
                    <div className={style.healthDetails}>
                        <div className={style.healthItem}>
                            <span>🚗 Vehículos operativos:</span>
                            <span>{stats.vehiculosDisponibles + stats.vehiculosEnUso + stats.vehiculosReservados}/{vehiculosData.length}</span>
                        </div>
                        <div className={style.healthItem}>
                            <span>👨‍💼 Conductores activos:</span>
                            <span>{stats.conductoresDisponibles + stats.conductoresEnRuta}/{conductoresData.length}</span>
                        </div>
                        <div className={style.healthItem}>
                            <span>⚠️ Alertas activas:</span>
                            <span>{alertas.length}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Métricas de Productividad */}
            <div className={style.productivityCard}>
                <h3>📊 Métricas de Productividad</h3>
                <div className={style.productivityGrid}>
                    <div className={style.productivityItem}>
                        <div className={style.productivityIcon}>📈</div>
                        <div className={style.productivityData}>
                            <span className={style.productivityValue}>{(asignacionesData.length / Math.max(vehiculosData.length, 1)).toFixed(1)}</span>
                            <span className={style.productivityLabel}>Asignaciones por vehículo</span>
                        </div>
                    </div>
                    
                    <div className={style.productivityItem}>
                        <div className={style.productivityIcon}>⏱️</div>
                        <div className={style.productivityData}>
                            <span className={style.productivityValue}>{(stats.kmTotales / Math.max(stats.asignacionesCompletadas, 1)).toFixed(1)}</span>
                            <span className={style.productivityLabel}>Km promedio por viaje</span>
                        </div>
                    </div>
                    
                    <div className={style.productivityItem}>
                        <div className={style.productivityIcon}>🎯</div>
                        <div className={style.productivityData}>
                            <span className={style.productivityValue}>{(stats.asignacionesCompletadas / Math.max(conductoresData.length, 1)).toFixed(1)}</span>
                            <span className={style.productivityLabel}>Viajes por conductor</span>
                        </div>
                    </div>

                    <div className={style.productivityItem}>
                        <div className={style.productivityIcon}>💰</div>
                        <div className={style.productivityData}>
                            <span className={style.productivityValue}>{((stats.kmTotales * 500) / 1000).toFixed(0)}K</span>
                            <span className={style.productivityLabel}>Costo estimado (CLP)</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <div className={style.vistaGeneral}>
            {/* Header de navegación */}
            <div className={style.viewTabs}>
                <button 
                    onClick={() => setVistaActiva('resumen')}
                    className={`${style.viewTab} ${vistaActiva === 'resumen' ? style.active : ''}`}
                >
                    📊 Vista Resumen
                </button>
                <button 
                    onClick={() => setVistaActiva('indicadores')}
                    className={`${style.viewTab} ${vistaActiva === 'indicadores' ? style.active : ''}`}
                >
                    🎯 KPIs e Indicadores
                </button>
            </div>

            {/* Contenido según vista activa */}
            {vistaActiva === 'resumen' ? renderVistaResumen() : renderVistaIndicadores()}

            {/* Alertas y notificaciones */}
            {alertas.length > 0 && (
                <div className={style.alertasSection}>
                    <AlertasList alertas={alertas} />
                </div>
            )}

            {/* Resumen estadístico mejorado */}
            <div className={style.resumenSection}>
                <h3>📈 Resumen Ejecutivo del Sistema</h3>
                <div className={style.resumenGrid}>
                    <div className={style.resumenItem}>
                        <span className={style.resumenLabel}>Tasa de Utilización</span>
                        <span className={style.resumenValue}>{stats.tasaUtilizacion}%</span>
                        <div className={style.progressBar}>
                            <div 
                                className={style.progressFill}
                                style={{ width: `${stats.tasaUtilizacion}%` }}
                            ></div>
                        </div>
                        <small className={style.resumenDescription}>
                            Porcentaje de vehículos en uso activo
                        </small>
                    </div>
                    
                    <div className={style.resumenItem}>
                        <span className={style.resumenLabel}>Eficiencia de Asignaciones</span>
                        <span className={style.resumenValue}>{stats.eficienciaAsignaciones}%</span>
                        <div className={style.progressBar}>
                            <div 
                                className={style.progressFill}
                                style={{ width: `${stats.eficienciaAsignaciones}%` }}
                            ></div>
                        </div>
                        <small className={style.resumenDescription}>
                            Tasa de asignaciones completadas exitosamente
                        </small>
                    </div>
                    
                    <div className={style.resumenItem}>
                        <span className={style.resumenLabel}>Disponibilidad de Conductores</span>
                        <span className={style.resumenValue}>
                            {conductoresData.length > 0 ? (stats.conductoresDisponibles / conductoresData.length * 100).toFixed(1) : 0}%
                        </span>
                        <div className={style.progressBar}>
                            <div 
                                className={style.progressFill}
                                style={{ 
                                    width: `${conductoresData.length > 0 ? (stats.conductoresDisponibles / conductoresData.length * 100) : 0}%` 
                                }}
                            ></div>
                        </div>
                        <small className={style.resumenDescription}>
                            Conductores disponibles para nuevas asignaciones
                        </small>
                    </div>

                    <div className={style.resumenItem}>
                        <span className={style.resumenLabel}>Rendimiento Operativo</span>
                        <span className={style.resumenValue}>
                            {stats.kmTotales > 0 && asignacionesData.length > 0 ? 
                                ((stats.asignacionesCompletadas / asignacionesData.length) * 100).toFixed(0) : 0}%
                        </span>
                        <div className={style.progressBar}>
                            <div 
                                className={style.progressFill}
                                style={{ 
                                    width: `${stats.kmTotales > 0 && asignacionesData.length > 0 ? 
                                        ((stats.asignacionesCompletadas / asignacionesData.length) * 100) : 0}%` 
                                }}
                            ></div>
                        </div>
                        <small className={style.resumenDescription}>
                            Índice general de performance del sistema
                        </small>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VistaGeneral;
