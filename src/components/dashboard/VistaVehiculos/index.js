// src/components/dashboard/VistaVehiculos/index.js
import { h } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, LineElement, PointElement, LinearScale, CategoryScale, BarElement, TimeScale, Filler } from 'chart.js';
import { Pie, Line, Bar, Doughnut } from 'react-chartjs-2';
import 'chartjs-adapter-date-fns';
import { getVehiculos } from '../../../services/vehicleService';
import { getAsignaciones } from '../../../services/asignacionService';
import { getMantenimientoHistorial, calculateAdditionalMetrics } from '../../../services/dashboardService';
import MetricCard from '../MetricCard';
import style from './style.css';

// Registrar componentes de Chart.js
ChartJS.register(ArcElement, Tooltip, Legend, LineElement, PointElement, LinearScale, CategoryScale, BarElement, TimeScale, Filler);

const VistaVehiculos = ({ data, loading, filtro }) => {
    const [vehiculos, setVehiculos] = useState([]);
    const [asignaciones, setAsignaciones] = useState([]);
    const [vehiculosEnriquecidos, setVehiculosEnriquecidos] = useState([]);
    const [loadingData, setLoadingData] = useState(true);
    const [vistaActiva, setVistaActiva] = useState('resumen');
    const [vehiculoSeleccionado, setVehiculoSeleccionado] = useState(null);
    const [filtros, setFiltros] = useState({
        busqueda: '',
        estado: 'todos',
        tipoVehiculo: 'todos',
        estadoMantenimiento: 'todos'
    });

    // Cargar datos iniciales
    useEffect(() => {
        const cargarDatos = async () => {
            try {
                setLoadingData(true);
                const [vehiculosData, asignacionesData] = await Promise.all([
                    getVehiculos().catch(() => []),
                    getAsignaciones().catch(() => [])
                ]);
                
                setVehiculos(vehiculosData);
                setAsignaciones(asignacionesData);
            } catch (error) {
                console.error('Error cargando datos de vehículos:', error);
            } finally {
                setLoadingData(false);
            }
        };

        cargarDatos();
    }, []);

    // Enriquecer datos de vehículos con información adicional
    useEffect(() => {
        const enriquecerVehiculos = async () => {
            if (vehiculos.length === 0) return;

            const vehiculosConDatos = await Promise.all(
                vehiculos.map(async (vehiculo) => {
                    // Calcular asignaciones por vehículo
                    const asignacionesVehiculo = asignaciones.filter(a => 
                        a.vehiculo && (a.vehiculo.id === vehiculo.id || a.vehiculo === vehiculo.id)
                    );
                    
                    const asignacionesCompletadas = asignacionesVehiculo.filter(a => 
                        a.estado === 'completada'
                    );

                    const asignacionesActivas = asignacionesVehiculo.filter(a => 
                        a.estado === 'activa' || a.estado === 'en_progreso'
                    );

                    // Calcular kilometraje y mantenimiento
                    const kmActual = vehiculo.kilometraje || 0;
                    const proximoMantenimiento = Math.ceil(kmActual / 10000) * 10000;
                    const kmParaMantenimiento = proximoMantenimiento - kmActual;
                    const porcentajeMantenimiento = Math.min(100, ((kmActual % 10000) / 10000) * 100);

                    // Determinar estado de mantenimiento
                    let estadoMantenimiento = 'bueno';
                    let alertaMantenimiento = '';
                    
                    if (kmParaMantenimiento < 500) {
                        estadoMantenimiento = 'critico';
                        alertaMantenimiento = 'Mantenimiento urgente requerido';
                    } else if (kmParaMantenimiento < 1500) {
                        estadoMantenimiento = 'atencion';
                        alertaMantenimiento = 'Programar mantenimiento pronto';
                    } else {
                        alertaMantenimiento = 'Estado normal';
                    }

                    // Calcular uso en período (últimos 30 días)
                    const fechaInicio = new Date();
                    fechaInicio.setDate(fechaInicio.getDate() - 30);
                    
                    const asignacionesPeriodo = asignacionesVehiculo.filter(a => 
                        new Date(a.fecha_hora_requerida_inicio) >= fechaInicio
                    );

                    const diasUsados = new Set(
                        asignacionesPeriodo.map(a => 
                            new Date(a.fecha_hora_requerida_inicio).toDateString()
                        )
                    ).size;

                    const kmRecorridos = asignacionesCompletadas.reduce(
                        (total, a) => total + (parseFloat(a.distancia_recorrida_km) || 0), 0
                    );

                    // Calcular eficiencia
                    const eficienciaAsignaciones = asignacionesVehiculo.length > 0 
                        ? (asignacionesCompletadas.length / asignacionesVehiculo.length * 100) 
                        : 0;

                    // Calcular costo operacional estimado
                    const costoPorKm = 450; // CLP por km
                    const costoOperacional = kmRecorridos * costoPorKm;

                    return {
                        ...vehiculo,
                        // Datos de uso
                        totalAsignaciones: asignacionesVehiculo.length,
                        asignacionesCompletadas: asignacionesCompletadas.length,
                        asignacionesActivas: asignacionesActivas.length,
                        kmRecorridos: parseFloat(kmRecorridos.toFixed(2)),
                        diasUsados30: diasUsados,
                        eficienciaAsignaciones: parseFloat(eficienciaAsignaciones.toFixed(1)),
                        
                        // Datos de mantenimiento
                        proximoMantenimientoKm: proximoMantenimiento,
                        kmParaMantenimiento: kmParaMantenimiento,
                        porcentajeMantenimiento: parseFloat(porcentajeMantenimiento.toFixed(1)),
                        estadoMantenimiento: estadoMantenimiento,
                        alertaMantenimiento: alertaMantenimiento,
                        
                        // Utilización y rendimiento
                        utilizacion: Math.min(100, (diasUsados / 30) * 100),
                        rendimientoKmDia: diasUsados > 0 ? (kmRecorridos / diasUsados).toFixed(1) : 0,
                        costoOperacional: costoOperacional,
                        
                        // Scoring general
                        score: Math.round((eficienciaAsignaciones * 0.4 + (100 - porcentajeMantenimiento) * 0.3 + (diasUsados / 30 * 100) * 0.3))
                    };
                })
            );

            setVehiculosEnriquecidos(vehiculosConDatos);
        };

        enriquecerVehiculos();
    }, [vehiculos, asignaciones]);

    // Calcular estadísticas generales
    const calcularEstadisticas = () => {
        if (vehiculosEnriquecidos.length === 0) {
            return {
                totalVehiculos: 0,
                disponibles: 0,
                enUso: 0,
                mantenimiento: 0,
                criticos: 0,
                utilizacionPromedio: 0,
                kmTotales: 0,
                costoTotal: 0,
                eficienciaPromedio: 0
            };
        }

        const disponibles = vehiculosEnriquecidos.filter(v => v.estado === 'disponible').length;
        const enUso = vehiculosEnriquecidos.filter(v => v.estado === 'en_uso' || v.estado === 'activo').length;
        const mantenimiento = vehiculosEnriquecidos.filter(v => v.estado === 'mantenimiento').length;
        const criticos = vehiculosEnriquecidos.filter(v => v.estadoMantenimiento === 'critico').length;

        const utilizacionPromedio = vehiculosEnriquecidos.reduce((sum, v) => sum + v.utilizacion, 0) / vehiculosEnriquecidos.length;
        const kmTotales = vehiculosEnriquecidos.reduce((sum, v) => sum + v.kmRecorridos, 0);
        const costoTotal = vehiculosEnriquecidos.reduce((sum, v) => sum + v.costoOperacional, 0);
        const eficienciaPromedio = vehiculosEnriquecidos.reduce((sum, v) => sum + v.eficienciaAsignaciones, 0) / vehiculosEnriquecidos.length;

        return {
            totalVehiculos: vehiculosEnriquecidos.length,
            disponibles,
            enUso,
            mantenimiento,
            criticos,
            utilizacionPromedio: parseFloat(utilizacionPromedio.toFixed(1)),
            kmTotales: parseFloat(kmTotales.toFixed(1)),
            costoTotal: Math.round(costoTotal),
            eficienciaPromedio: parseFloat(eficienciaPromedio.toFixed(1))
        };
    };

    const stats = calcularEstadisticas();

    // Datos para gráficos
    const chartDataEstados = {
        labels: ['Disponibles', 'En Uso', 'Mantenimiento', 'Reservados'],
        datasets: [{
            data: [
                stats.disponibles,
                stats.enUso,
                stats.mantenimiento,
                vehiculosEnriquecidos.filter(v => v.estado === 'reservado').length
            ],
            backgroundColor: ['#10B981', '#3B82F6', '#F59E0B', '#8B5CF6'],
            borderWidth: 3,
            borderColor: '#ffffff',
            hoverBorderWidth: 4,
            hoverOffset: 8
        }]
    };

    const chartDataMantenimiento = {
        labels: ['Estado Bueno', 'Requiere Atención', 'Crítico'],
        datasets: [{
            data: [
                vehiculosEnriquecidos.filter(v => v.estadoMantenimiento === 'bueno').length,
                vehiculosEnriquecidos.filter(v => v.estadoMantenimiento === 'atencion').length,
                vehiculosEnriquecidos.filter(v => v.estadoMantenimiento === 'critico').length
            ],
            backgroundColor: ['#10B981', '#F59E0B', '#EF4444'],
            borderWidth: 3,
            borderColor: '#ffffff',
            hoverBorderWidth: 4,
            hoverOffset: 8
        }]
    };

    // Top 5 vehículos por utilización
    const topVehiculosUtilizacion = vehiculosEnriquecidos
        .sort((a, b) => b.utilizacion - a.utilizacion)
        .slice(0, 5);

    const chartDataUtilizacion = {
        labels: topVehiculosUtilizacion.map(v => v.patente),
        datasets: [{
            label: 'Utilización (%)',
            data: topVehiculosUtilizacion.map(v => v.utilizacion),
            backgroundColor: 'rgba(59, 130, 246, 0.8)',
            borderColor: '#3B82F6',
            borderWidth: 2,
            borderRadius: 4,
            borderSkipped: false,
        }]
    };

    // Análisis de costos por vehículo
    const topVehiculosCosto = vehiculosEnriquecidos
        .sort((a, b) => b.costoOperacional - a.costoOperacional)
        .slice(0, 5);

    const chartDataCostos = {
        labels: topVehiculosCosto.map(v => v.patente),
        datasets: [{
            label: 'Costo Operacional (CLP)',
            data: topVehiculosCosto.map(v => v.costoOperacional),
            backgroundColor: 'rgba(245, 158, 11, 0.8)',
            borderColor: '#F59E0B',
            borderWidth: 2,
            borderRadius: 4,
            borderSkipped: false,
        }]
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
                    font: { weight: 600 }
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
                titleFont: { weight: 600 }
            }
        }
    };

    const barChartOptions = {
        ...chartOptions,
        scales: {
            y: {
                beginAtZero: true,
                grid: { color: 'rgba(0, 0, 0, 0.05)' },
                ticks: { font: { weight: 500 } }
            },
            x: {
                grid: { color: 'rgba(0, 0, 0, 0.05)' },
                ticks: { font: { weight: 500 } }
            }
        }
    };

    if (loading || loadingData) {
        return (
            <div className={style.loadingContainer}>
                <div className={style.spinner}></div>
                <p>Cargando datos de vehículos...</p>
            </div>
        );
    }

    const renderVistaResumen = () => (
        <>
            {/* Métricas principales */}
            <div className={style.metricsGrid}>
                <MetricCard
                    title="Flota Total"
                    value={stats.totalVehiculos}
                    subtitle={`${stats.utilizacionPromedio}% utilización promedio`}
                    icon="🚗"
                    trend={{ 
                        value: stats.utilizacionPromedio >= 70 ? 'Alta utilización' : stats.utilizacionPromedio >= 40 ? 'Uso moderado' : 'Baja utilización', 
                        direction: stats.utilizacionPromedio >= 70 ? 'up' : 'down' 
                    }}
                    color={stats.utilizacionPromedio >= 70 ? "orange" : stats.utilizacionPromedio >= 40 ? "blue" : "green"}
                />
                
                <MetricCard
                    title="Vehículos Disponibles"
                    value={stats.disponibles}
                    subtitle={`${stats.enUso} en uso actualmente`}
                    icon="✅"
                    trend={{ 
                        value: `${((stats.disponibles / Math.max(stats.totalVehiculos, 1)) * 100).toFixed(0)}% disponibles`,
                        direction: 'up' 
                    }}
                    color="green"
                />
                
                <MetricCard
                    title="Mantenimientos Críticos"
                    value={stats.criticos}
                    subtitle={`${stats.mantenimiento} en mantenimiento`}
                    icon="⚠️"
                    trend={{ 
                        value: stats.criticos > 0 ? 'Requiere atención' : 'Todo bajo control',
                        direction: stats.criticos > 0 ? 'down' : 'up' 
                    }}
                    color={stats.criticos > 0 ? "red" : "green"}
                />
                
                <MetricCard
                    title="Costo Operacional"
                    value={`$${(stats.costoTotal / 1000000).toFixed(1)}M`}
                    subtitle={`${stats.kmTotales} km recorridos`}
                    icon="💰"
                    trend={{ 
                        value: `${stats.eficienciaPromedio}% eficiencia`,
                        direction: stats.eficienciaPromedio >= 70 ? 'up' : 'down' 
                    }}
                    color="purple"
                />
            </div>

            {/* Gráficos principales */}
            <div className={style.chartsGrid}>
                <div className={style.chartCard}>
                    <h3>🚗 Estado de la Flota</h3>
                    <div className={style.chartContainer}>
                        <Doughnut data={chartDataEstados} options={chartOptions} />
                    </div>
                </div>

                <div className={style.chartCard}>
                    <h3>🔧 Estado de Mantenimiento</h3>
                    <div className={style.chartContainer}>
                        <Pie data={chartDataMantenimiento} options={chartOptions} />
                    </div>
                </div>

                <div className={style.chartCard}>
                    <h3>📊 Top 5 Vehículos - Utilización</h3>
                    <div className={style.chartContainer}>
                        <Bar data={chartDataUtilizacion} options={barChartOptions} />
                    </div>
                </div>

                <div className={style.chartCard}>
                    <h3>💰 Top 5 Vehículos - Costos</h3>
                    <div className={style.chartContainer}>
                        <Bar data={chartDataCostos} options={barChartOptions} />
                    </div>
                </div>
            </div>
        </>
    );

    const renderVistaDetalle = () => (
        <div className={style.detalleGrid}>
            {/* Debug temporal */}
            <div style={{background: '#e3f2fd', padding: '10px', marginBottom: '10px', borderRadius: '4px', fontSize: '12px'}}>
                Debug: {vehiculosEnriquecidos.length} vehículos | Cargando: {loadingData ? 'Sí' : 'No'} | Estado filtro: {filtros.estado}
            </div>
            
            {/* Lista de vehículos con detalles */}
            <div className={style.vehiculosList}>
                <div className={style.listHeader}>
                    <h3>📋 Detalle de Vehículos</h3>
                    <div className={style.filtrosRapidos}>
                        <button 
                            onClick={() => setFiltros({...filtros, estado: 'todos'})}
                            className={filtros.estado === 'todos' ? style.active : ''}
                        >
                            Todos ({vehiculosEnriquecidos.length})
                        </button>
                        <button 
                            onClick={() => setFiltros({...filtros, estado: 'disponible'})}
                            className={filtros.estado === 'disponible' ? style.active : ''}
                        >
                            Disponibles ({stats.disponibles})
                        </button>
                        <button 
                            onClick={() => setFiltros({...filtros, estado: 'en_uso'})}
                            className={filtros.estado === 'en_uso' ? style.active : ''}
                        >
                            En Uso ({stats.enUso})
                        </button>
                        <button 
                            onClick={() => setFiltros({...filtros, estadoMantenimiento: 'critico'})}
                            className={filtros.estadoMantenimiento === 'critico' ? style.active : ''}
                        >
                            Críticos ({stats.criticos})
                        </button>
                    </div>
                </div>

                <div className={style.vehiculosGrid}>
                    {loadingData ? (
                        <div style={{padding: '40px', textAlign: 'center'}}>
                            <div>Cargando vehículos...</div>
                        </div>
                    ) : vehiculosEnriquecidos.length === 0 ? (
                        <div style={{padding: '40px', textAlign: 'center', background: '#f8f9fa', borderRadius: '8px'}}>
                            <h4>No hay vehículos para mostrar</h4>
                            <p>Verifica que el servicio de vehículos esté funcionando correctamente.</p>
                        </div>
                    ) : (
                        vehiculosEnriquecidos.map((vehiculo, index) => (
                        <div key={vehiculo.id || index} className={style.vehiculoCard}>
                            <div className={style.vehiculoHeader}>
                                <div className={style.vehiculoInfo}>
                                    <h4>{vehiculo.marca || 'N/A'} {vehiculo.modelo || 'N/A'}</h4>
                                    <span className={style.patente}>{vehiculo.patente || 'Sin patente'}</span>
                                </div>
                                <div className={`${style.estadoBadge} ${style[vehiculo.estado] || ''}`}>
                                    {vehiculo.estado || 'N/A'}
                                </div>
                            </div>

                            <div className={style.vehiculoMetrics}>
                                <div className={style.metricaItem}>
                                    <span className={style.metricaLabel}>Utilización</span>
                                    <span className={style.metricaValue}>{vehiculo.utilizacion || 0}%</span>
                                    <div className={style.metricaBar}>
                                        <div 
                                            className={style.metricaFill}
                                            style={{ width: `${vehiculo.utilizacion || 0}%` }}
                                        ></div>
                                    </div>
                                </div>

                                <div className={style.metricaItem}>
                                    <span className={style.metricaLabel}>Mantenimiento</span>
                                    <span className={`${style.metricaValue} ${style[vehiculo.estadoMantenimiento] || ''}`}>
                                        {vehiculo.porcentajeMantenimiento || 0}%
                                    </span>
                                    <div className={style.metricaBar}>
                                        <div 
                                            className={`${style.metricaFill} ${style[vehiculo.estadoMantenimiento] || ''}`}
                                            style={{ width: `${vehiculo.porcentajeMantenimiento || 0}%` }}
                                        ></div>
                                    </div>
                                </div>
                            </div>

                            <div className={style.vehiculoStats}>
                                <div className={style.statItem}>
                                    <span className={style.statIcon}>📊</span>
                                    <div>
                                        <span className={style.statValue}>{vehiculo.totalAsignaciones || 0}</span>
                                        <span className={style.statLabel}>Asignaciones</span>
                                    </div>
                                </div>
                                <div className={style.statItem}>
                                    <span className={style.statIcon}>🛣️</span>
                                    <div>
                                        <span className={style.statValue}>{vehiculo.kmRecorridos || 0}</span>
                                        <span className={style.statLabel}>Km recorridos</span>
                                    </div>
                                </div>
                                <div className={style.statItem}>
                                    <span className={style.statIcon}>💰</span>
                                    <div>
                                        <span className={style.statValue}>${((vehiculo.costoOperacional || 0) / 1000).toFixed(0)}K</span>
                                        <span className={style.statLabel}>Costo op.</span>
                                    </div>
                                </div>
                            </div>

                            <div className={style.vehiculoAlerta}>
                                <span className={`${style.alertaIcon} ${style[vehiculo.estadoMantenimiento] || ''}`}>
                                    {vehiculo.estadoMantenimiento === 'critico' ? '🔴' : 
                                     vehiculo.estadoMantenimiento === 'atencion' ? '🟡' : '🟢'}
                                </span>
                                <span className={style.alertaTexto}>{vehiculo.alertaMantenimiento || 'Estado normal'}</span>
                            </div>
                        </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );

    return (
        <div className={style.vistaVehiculos}>
            {/* Header de navegación */}
            <div className={style.viewTabs}>
                <button 
                    onClick={() => setVistaActiva('resumen')}
                    className={`${style.viewTab} ${vistaActiva === 'resumen' ? style.active : ''}`}
                >
                    📊 Vista Resumen
                </button>
                <button 
                    onClick={() => setVistaActiva('detalle')}
                    className={`${style.viewTab} ${vistaActiva === 'detalle' ? style.active : ''}`}
                >
                    🚗 Detalle de Vehículos
                </button>
            </div>

            {/* Contenido según vista activa */}
            {vistaActiva === 'resumen' ? renderVistaResumen() : renderVistaDetalle()}
        </div>
    );
};

export default VistaVehiculos;

 