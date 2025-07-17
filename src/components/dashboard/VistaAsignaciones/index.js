// src/components/dashboard/VistaAsignaciones/index.js
import { h } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, LineElement, PointElement, LinearScale, CategoryScale, BarElement, TimeScale, Filler } from 'chart.js';
import { Pie, Line, Bar, Doughnut } from 'react-chartjs-2';
import 'chartjs-adapter-date-fns';
import { getAsignaciones } from '../../../services/asignacionService';
import { getVehiculos } from '../../../services/vehicleService';
import { getConductores } from '../../../services/conductorService';
import MetricCard from '../MetricCard';
import style from './style.css';

// Registrar componentes de Chart.js
ChartJS.register(ArcElement, Tooltip, Legend, LineElement, PointElement, LinearScale, CategoryScale, BarElement, TimeScale, Filler);

const VistaAsignaciones = ({ data, loading, filtro }) => {
    const [asignaciones, setAsignaciones] = useState([]);
    const [vehiculos, setVehiculos] = useState([]);
    const [conductores, setConductores] = useState([]);
    const [metricas, setMetricas] = useState({});
    const [loadingData, setLoadingData] = useState(true);
    const [filtroLocalPeriodo, setFiltroLocalPeriodo] = useState('7'); // días
    const [vistaActiva, setVistaActiva] = useState('general');

    // Cargar datos iniciales
    useEffect(() => {
        const cargarDatos = async () => {
            try {
                setLoadingData(true);
                const [asignacionesData, vehiculosData, conductoresData] = await Promise.all([
                    getAsignaciones(),
                    getVehiculos(),
                    getConductores()
                ]);
                
                setAsignaciones(asignacionesData || []);
                setVehiculos(vehiculosData || []);
                setConductores(conductoresData || []);
            } catch (error) {
                console.error('Error cargando datos para vista de asignaciones:', error);
                setAsignaciones([]);
                setVehiculos([]);
                setConductores([]);
            } finally {
                setLoadingData(false);
            }
        };

        cargarDatos();
    }, []);

    // Calcular métricas cuando cambien los datos o filtros
    useEffect(() => {
        if (asignaciones.length === 0) return;

        const calcularMetricas = () => {
            const fechaLimite = new Date();
            fechaLimite.setDate(fechaLimite.getDate() - parseInt(filtroLocalPeriodo));

            // Filtrar asignaciones por período
            const asignacionesFiltradas = asignaciones.filter(a => {
                const fechaAsignacion = new Date(a.fecha_hora_requerida_inicio);
                return fechaAsignacion >= fechaLimite;
            });

            // Métricas básicas
            const total = asignacionesFiltradas.length;
            const completadas = asignacionesFiltradas.filter(a => a.estado === 'completada').length;
            const activas = asignacionesFiltradas.filter(a => a.estado === 'activa').length;
            const programadas = asignacionesFiltradas.filter(a => a.estado === 'programada').length;
            const pendientes = asignacionesFiltradas.filter(a => a.estado === 'pendiente_auto').length;
            const canceladas = asignacionesFiltradas.filter(a => a.estado === 'cancelada').length;

            // Métricas de eficiencia
            const tasaCompletacion = total > 0 ? (completadas / total * 100).toFixed(1) : 0;
            const tasaCancelacion = total > 0 ? (canceladas / total * 100).toFixed(1) : 0;

            // Distancia total y promedio
            const distanciaTotal = asignacionesFiltradas
                .filter(a => a.distancia_recorrida_km && a.estado === 'completada')
                .reduce((sum, a) => sum + parseFloat(a.distancia_recorrida_km || 0), 0);
            
            const distanciaPromedio = completadas > 0 ? (distanciaTotal / completadas).toFixed(2) : 0;

            // Tiempo promedio de asignación (cuando hay fecha fin)
            const asignacionesConTiempo = asignacionesFiltradas.filter(a => 
                a.fecha_hora_fin_prevista && a.fecha_hora_requerida_inicio && a.estado === 'completada'
            );

            const tiempoPromedio = asignacionesConTiempo.length > 0 
                ? asignacionesConTiempo.reduce((sum, a) => {
                    const inicio = new Date(a.fecha_hora_requerida_inicio);
                    const fin = new Date(a.fecha_hora_fin_prevista);
                    return sum + ((fin - inicio) / (1000 * 60 * 60)); // horas
                }, 0) / asignacionesConTiempo.length
                : 0;

            // Análisis por día de la semana
            const asignacionesPorDia = {};
            const diasSemana = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
            
            diasSemana.forEach(dia => {
                asignacionesPorDia[dia] = 0;
            });

            asignacionesFiltradas.forEach(a => {
                const fecha = new Date(a.fecha_hora_requerida_inicio);
                const dia = diasSemana[fecha.getDay()];
                asignacionesPorDia[dia]++;
            });

            // Análisis por hora del día
            const asignacionesPorHora = {};
            for (let i = 0; i < 24; i++) {
                asignacionesPorHora[i] = 0;
            }

            asignacionesFiltradas.forEach(a => {
                const fecha = new Date(a.fecha_hora_requerida_inicio);
                const hora = fecha.getHours();
                asignacionesPorHora[hora]++;
            });

            // Top conductores y vehículos
            const conductoresFrecuencia = {};
            const vehiculosFrecuencia = {};

            asignacionesFiltradas.forEach(a => {
                if (a.conductor && a.conductor.id) {
                    const conductorKey = `${a.conductor.nombre} ${a.conductor.apellido}`;
                    conductoresFrecuencia[conductorKey] = (conductoresFrecuencia[conductorKey] || 0) + 1;
                }
                
                if (a.vehiculo && a.vehiculo.id) {
                    const vehiculoKey = a.vehiculo.patente;
                    vehiculosFrecuencia[vehiculoKey] = (vehiculosFrecuencia[vehiculoKey] || 0) + 1;
                }
            });

            // Análisis de tendencias (últimos días)
            const tendencias = [];
            for (let i = parseInt(filtroLocalPeriodo) - 1; i >= 0; i--) {
                const fecha = new Date();
                fecha.setDate(fecha.getDate() - i);
                const fechaStr = fecha.toISOString().split('T')[0];
                
                const asignacionesDia = asignacionesFiltradas.filter(a => {
                    const fechaAsignacion = new Date(a.fecha_hora_requerida_inicio);
                    return fechaAsignacion.toISOString().split('T')[0] === fechaStr;
                });

                tendencias.push({
                    fecha: fechaStr,
                    total: asignacionesDia.length,
                    completadas: asignacionesDia.filter(a => a.estado === 'completada').length,
                    canceladas: asignacionesDia.filter(a => a.estado === 'cancelada').length
                });
            }

            setMetricas({
                // Básicas
                total,
                completadas,
                activas,
                programadas,
                pendientes,
                canceladas,
                
                // Eficiencia
                tasaCompletacion: parseFloat(tasaCompletacion),
                tasaCancelacion: parseFloat(tasaCancelacion),
                
                // Distancia y tiempo
                distanciaTotal: parseFloat(distanciaTotal.toFixed(2)),
                distanciaPromedio: parseFloat(distanciaPromedio),
                tiempoPromedio: parseFloat(tiempoPromedio.toFixed(2)),
                
                // Análisis
                asignacionesPorDia,
                asignacionesPorHora,
                conductoresFrecuencia,
                vehiculosFrecuencia,
                tendencias
            });
        };

        calcularMetricas();
    }, [asignaciones, filtroLocalPeriodo]);

    // Configuraciones de gráficos
    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'bottom',
                labels: {
                    usePointStyle: true,
                    padding: 20
                }
            }
        }
    };

    const chartColorsEstados = {
        completadas: '#10B981',
        activas: '#3B82F6', 
        programadas: '#F59E0B',
        pendientes: '#8B5CF6',
        canceladas: '#EF4444'
    };

    // Datos para gráfico de estados
    const datosEstados = {
        labels: ['Completadas', 'Activas', 'Programadas', 'Pendientes', 'Canceladas'],
        datasets: [{
            data: [
                metricas.completadas || 0,
                metricas.activas || 0,
                metricas.programadas || 0,
                metricas.pendientes || 0,
                metricas.canceladas || 0
            ],
            backgroundColor: Object.values(chartColorsEstados),
            borderWidth: 2,
            borderColor: '#ffffff'
        }]
    };

    // Datos para gráfico de tendencias
    const datosTendencias = {
        labels: (metricas.tendencias || []).map(t => {
            const fecha = new Date(t.fecha);
            return fecha.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' });
        }),
        datasets: [
            {
                label: 'Total',
                data: (metricas.tendencias || []).map(t => t.total),
                borderColor: '#3B82F6',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                tension: 0.4,
                fill: true
            },
            {
                label: 'Completadas',
                data: (metricas.tendencias || []).map(t => t.completadas),
                borderColor: '#10B981',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                tension: 0.4,
                fill: false
            }
        ]
    };

    // Datos para gráfico por día de semana
    const datosPorDia = {
        labels: Object.keys(metricas.asignacionesPorDia || {}),
        datasets: [{
            label: 'Asignaciones',
            data: Object.values(metricas.asignacionesPorDia || {}),
            backgroundColor: '#3B82F6',
            borderColor: '#1E40AF',
            borderWidth: 1
        }]
    };

    // Datos para gráfico por hora
    const datosPorHora = {
        labels: Array.from({ length: 24 }, (_, i) => `${i}:00`),
        datasets: [{
            label: 'Asignaciones',
            data: Object.values(metricas.asignacionesPorHora || {}),
            backgroundColor: '#8B5CF6',
            borderColor: '#7C3AED',
            borderWidth: 1
        }]
    };

    if (loading || loadingData) {
        return (
            <div className={style.loadingContainer}>
                <div className={style.spinner}></div>
                <p>Cargando análisis de asignaciones...</p>
            </div>
        );
    }

    const renderVistaGeneral = () => (
        <>
            {/* Métricas principales */}
            <div className={style.metricsGrid}>
                <MetricCard
                    title="Total Asignaciones"
                    value={metricas.total || 0}
                    subtitle={`Últimos ${filtroLocalPeriodo} días`}
                    icon="📋"
                    trend={{ 
                        value: metricas.total > 0 ? '+' + Math.round((metricas.total / parseInt(filtroLocalPeriodo)) * 7) + '/sem' : '0',
                        direction: 'up' 
                    }}
                    color="blue"
                />
                
                <MetricCard
                    title="Tasa de Completación"
                    value={`${metricas.tasaCompletacion || 0}%`}
                    subtitle={`${metricas.completadas || 0} completadas`}
                    icon="✅"
                    trend={{ 
                        value: metricas.tasaCompletacion >= 80 ? 'Excelente' : metricas.tasaCompletacion >= 60 ? 'Bueno' : 'Mejorar',
                        direction: metricas.tasaCompletacion >= 80 ? 'up' : 'down' 
                    }}
                    color={metricas.tasaCompletacion >= 80 ? "green" : metricas.tasaCompletacion >= 60 ? "orange" : "red"}
                />
                
                <MetricCard
                    title="Distancia Total"
                    value={`${metricas.distanciaTotal || 0} km`}
                    subtitle={`Promedio: ${metricas.distanciaPromedio || 0} km`}
                    icon="🛣️"
                    trend={{ 
                        value: `${metricas.distanciaPromedio || 0} km/viaje`,
                        direction: 'up' 
                    }}
                    color="purple"
                />
                
                <MetricCard
                    title="Tiempo Promedio"
                    value={`${metricas.tiempoPromedio || 0}h`}
                    subtitle="por asignación"
                    icon="⏱️"
                    trend={{ 
                        value: metricas.tiempoPromedio <= 2 ? 'Eficiente' : 'Normal',
                        direction: metricas.tiempoPromedio <= 2 ? 'up' : 'down' 
                    }}
                    color="orange"
                />
            </div>

            {/* Gráficos principales */}
            <div className={style.chartsGrid}>
                <div className={style.chartCard}>
                    <h3>Estado de Asignaciones</h3>
                    <div className={style.chartContainer}>
                        <Doughnut data={datosEstados} options={chartOptions} />
                    </div>
                </div>

                <div className={style.chartCard}>
                    <h3>Tendencia Temporal</h3>
                    <div className={style.chartContainer}>
                        <Line data={datosTendencias} options={{
                            ...chartOptions,
                            scales: {
                                y: {
                                    beginAtZero: true,
                                    ticks: {
                                        stepSize: 1
                                    }
                                }
                            }
                        }} />
                    </div>
                </div>

                <div className={style.chartCard}>
                    <h3>Asignaciones por Día de Semana</h3>
                    <div className={style.chartContainer}>
                        <Bar data={datosPorDia} options={{
                            ...chartOptions,
                            scales: {
                                y: {
                                    beginAtZero: true,
                                    ticks: {
                                        stepSize: 1
                                    }
                                }
                            }
                        }} />
                    </div>
                </div>

                <div className={style.chartCard}>
                    <h3>Distribución por Hora del Día</h3>
                    <div className={style.chartContainer}>
                        <Bar data={datosPorHora} options={{
                            ...chartOptions,
                            scales: {
                                y: {
                                    beginAtZero: true,
                                    ticks: {
                                        stepSize: 1
                                    }
                                },
                                x: {
                                    ticks: {
                                        maxTicksLimit: 12
                                    }
                                }
                            }
                        }} />
                    </div>
                </div>
            </div>
        </>
    );

    const renderVistaDetallada = () => (
        <div className={style.detalleGrid}>
            {/* Top Conductores */}
            <div className={style.detailCard}>
                <h3>🏆 Top Conductores</h3>
                <div className={style.rankingList}>
                    {Object.entries(metricas.conductoresFrecuencia || {})
                        .sort(([,a], [,b]) => b - a)
                        .slice(0, 5)
                        .map(([conductor, cantidad], index) => (
                            <div key={conductor} className={style.rankingItem}>
                                <span className={style.rankingPosition}>{index + 1}</span>
                                <span className={style.rankingName}>{conductor}</span>
                                <span className={style.rankingValue}>{cantidad} asignaciones</span>
                            </div>
                        ))
                    }
                </div>
            </div>

            {/* Top Vehículos */}
            <div className={style.detailCard}>
                <h3>🚗 Top Vehículos</h3>
                <div className={style.rankingList}>
                    {Object.entries(metricas.vehiculosFrecuencia || {})
                        .sort(([,a], [,b]) => b - a)
                        .slice(0, 5)
                        .map(([vehiculo, cantidad], index) => (
                            <div key={vehiculo} className={style.rankingItem}>
                                <span className={style.rankingPosition}>{index + 1}</span>
                                <span className={style.rankingName}>{vehiculo}</span>
                                <span className={style.rankingValue}>{cantidad} asignaciones</span>
                            </div>
                        ))
                    }
                </div>
            </div>

            {/* Métricas de Eficiencia */}
            <div className={style.detailCard}>
                <h3>📊 Indicadores de Eficiencia</h3>
                <div className={style.indicatorsList}>
                    <div className={style.indicatorItem}>
                        <span className={style.indicatorLabel}>Tasa de Cancelación</span>
                        <span className={`${style.indicatorValue} ${metricas.tasaCancelacion <= 5 ? style.good : metricas.tasaCancelacion <= 15 ? style.warning : style.danger}`}>
                            {metricas.tasaCancelacion || 0}%
                        </span>
                    </div>
                    <div className={style.indicatorItem}>
                        <span className={style.indicatorLabel}>Asignaciones Activas</span>
                        <span className={style.indicatorValue}>{metricas.activas || 0}</span>
                    </div>
                    <div className={style.indicatorItem}>
                        <span className={style.indicatorLabel}>Programadas</span>
                        <span className={style.indicatorValue}>{metricas.programadas || 0}</span>
                    </div>
                    <div className={style.indicatorItem}>
                        <span className={style.indicatorLabel}>Pendientes Auto</span>
                        <span className={`${style.indicatorValue} ${metricas.pendientes > 5 ? style.warning : style.good}`}>
                            {metricas.pendientes || 0}
                        </span>
                    </div>
                </div>
            </div>

            {/* Resumen Temporal */}
            <div className={style.detailCard}>
                <h3>📅 Resumen por Período</h3>
                <div className={style.periodSummary}>
                    <div className={style.periodItem}>
                        <span className={style.periodLabel}>Promedio Diario</span>
                        <span className={style.periodValue}>
                            {((metricas.total || 0) / parseInt(filtroLocalPeriodo)).toFixed(1)} asignaciones
                        </span>
                    </div>
                    <div className={style.periodItem}>
                        <span className={style.periodLabel}>Día más Activo</span>
                        <span className={style.periodValue}>
                            {Object.entries(metricas.asignacionesPorDia || {})
                                .sort(([,a], [,b]) => b - a)[0]?.[0] || 'N/A'}
                        </span>
                    </div>
                    <div className={style.periodItem}>
                        <span className={style.periodLabel}>Hora Pico</span>
                        <span className={style.periodValue}>
                            {Object.entries(metricas.asignacionesPorHora || {})
                                .sort(([,a], [,b]) => b - a)[0]?.[0] || 'N/A'}:00
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <div className={style.vistaAsignaciones}>
            {/* Header con controles */}
            <div className={style.header}>
                <div className={style.titleSection}>
                    <h2>📊 Análisis Inteligente de Asignaciones</h2>
                    <p>Dashboard avanzado con métricas de performance y tendencias</p>
                </div>
                
                <div className={style.controls}>
                    <select 
                        value={filtroLocalPeriodo}
                        onChange={(e) => setFiltroLocalPeriodo(e.target.value)}
                        className={style.periodSelect}
                    >
                        <option value="7">Últimos 7 días</option>
                        <option value="15">Últimos 15 días</option>
                        <option value="30">Últimos 30 días</option>
                        <option value="60">Últimos 60 días</option>
                        <option value="90">Últimos 90 días</option>
                    </select>
                </div>
            </div>

            {/* Navegación de vistas */}
            <div className={style.viewTabs}>
                <button 
                    onClick={() => setVistaActiva('general')}
                    className={`${style.viewTab} ${vistaActiva === 'general' ? style.active : ''}`}
                >
                    📊 Vista General
                </button>
                <button 
                    onClick={() => setVistaActiva('detallada')}
                    className={`${style.viewTab} ${vistaActiva === 'detallada' ? style.active : ''}`}
                >
                    🔍 Análisis Detallado
                </button>
            </div>

            {/* Contenido según vista activa */}
            <div className={style.content}>
                {vistaActiva === 'general' ? renderVistaGeneral() : renderVistaDetallada()}
            </div>
        </div>
    );
};

export default VistaAsignaciones;