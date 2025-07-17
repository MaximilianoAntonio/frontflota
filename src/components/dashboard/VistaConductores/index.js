// src/components/dashboard/VistaConductores/index.js
import { h } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import { 
    Chart as ChartJS, 
    ArcElement, 
    Tooltip, 
    Legend, 
    LineElement, 
    PointElement, 
    LinearScale, 
    CategoryScale,
    BarElement,
    TimeScale,
    Filler
} from 'chart.js';
import { Pie, Doughnut, Bar, Line } from 'react-chartjs-2';
import { getConductores } from '../../../services/conductorService';
import { getAsignaciones } from '../../../services/asignacionService';
import { dashboardService } from '../../../services/dashboardService';
import style from './style.css';

ChartJS.register(ArcElement, Tooltip, Legend, LineElement, PointElement, LinearScale, CategoryScale, BarElement, TimeScale, Filler);

const VistaConductores = ({ data, loading, filtro }) => {
    const [conductores, setConductores] = useState([]);
    const [asignaciones, setAsignaciones] = useState([]);
    const [conductoresEnriquecidos, setConductoresEnriquecidos] = useState([]);
    const [loadingData, setLoadingData] = useState(true);
    const [vistaActual, setVistaActual] = useState('resumen');
    const [filtros, setFiltros] = useState({
        busqueda: '',
        estado: 'todos',
        disponibilidad: 'todos',
        licencia: 'todos',
        rendimiento: 'todos'
    });
    const [conductorSeleccionado, setConductorSeleccionado] = useState(null);
    const [estadisticas, setEstadisticas] = useState(null);

    // Cargar datos iniciales
    useEffect(() => {
        const cargarDatos = async () => {
            try {
                setLoadingData(true);
                const [conductoresData, asignacionesData] = await Promise.all([
                    getConductores(),
                    getAsignaciones()
                ]);
                
                setConductores(conductoresData || []);
                setAsignaciones(asignacionesData || []);
            } catch (error) {
                console.error('Error cargando datos de conductores:', error);
                setConductores([]);
                setAsignaciones([]);
            } finally {
                setLoadingData(false);
            }
        };

        cargarDatos();
    }, []);

    // Procesar datos de conductores con analytics avanzado
    useEffect(() => {
        const procesarDatos = async () => {
            if (conductores.length === 0) return;

            try {
                const conductoresConAnalytics = conductores.map(conductor => {
                    // Filtrar asignaciones del conductor
                    const asignacionesConductor = asignaciones.filter(a => 
                        a.conductor && a.conductor.id === conductor.id
                    );

                    // Períodos de análisis
                    const ahora = new Date();
                    const inicio30Dias = new Date(ahora);
                    inicio30Dias.setDate(inicio30Dias.getDate() - 30);
                    const inicio7Dias = new Date(ahora);
                    inicio7Dias.setDate(inicio7Dias.getDate() - 7);

                    // Asignaciones por período
                    const asignaciones30Dias = asignacionesConductor.filter(a => 
                        new Date(a.fecha_hora_requerida_inicio) >= inicio30Dias
                    );
                    const asignaciones7Dias = asignacionesConductor.filter(a => 
                        new Date(a.fecha_hora_requerida_inicio) >= inicio7Dias
                    );

                    // Estados de asignaciones
                    const completadas30 = asignaciones30Dias.filter(a => a.estado === 'completada').length;
                    const canceladas30 = asignaciones30Dias.filter(a => a.estado === 'cancelada').length;
                    const enProgreso = asignacionesConductor.filter(a => a.estado === 'en_progreso').length;

                    // Análisis de licencia
                    const fechaVencimiento = new Date(conductor.fecha_vencimiento_licencia);
                    const diasParaVencimiento = Math.ceil((fechaVencimiento - ahora) / (1000 * 60 * 60 * 24));
                    
                    let estadoLicencia = 'vigente';
                    let alertaLicencia = null;
                    
                    if (diasParaVencimiento < 0) {
                        estadoLicencia = 'vencida';
                        alertaLicencia = 'CRÍTICO: Licencia vencida';
                    } else if (diasParaVencimiento <= 30) {
                        estadoLicencia = 'por_vencer';
                        alertaLicencia = `⚠️ Vence en ${diasParaVencimiento} días`;
                    } else if (diasParaVencimiento <= 60) {
                        alertaLicencia = `📅 Vence en ${diasParaVencimiento} días`;
                    }

                    // Métricas de rendimiento
                    const tasaCompletacion = asignaciones30Dias.length > 0 
                        ? (completadas30 / asignaciones30Dias.length) * 100 
                        : 0;

                    const tasaCancelacion = asignaciones30Dias.length > 0 
                        ? (canceladas30 / asignaciones30Dias.length) * 100 
                        : 0;

                    // Días trabajados únicos
                    const diasTrabajados30 = new Set(
                        asignaciones30Dias.map(a => 
                            new Date(a.fecha_hora_requerida_inicio).toDateString()
                        )
                    ).size;

                    const diasTrabajados7 = new Set(
                        asignaciones7Dias.map(a => 
                            new Date(a.fecha_hora_requerida_inicio).toDateString()
                        )
                    ).size;

                    // Horas trabajadas
                    const horasTrabajadas30 = asignaciones30Dias.reduce((total, a) => {
                        if (a.fecha_hora_fin_real && a.fecha_hora_requerida_inicio) {
                            const inicio = new Date(a.fecha_hora_requerida_inicio);
                            const fin = new Date(a.fecha_hora_fin_real);
                            return total + (fin - inicio) / (1000 * 60 * 60);
                        }
                        return total;
                    }, 0);

                    // Kilómetros recorridos
                    const kmRecorridos30 = asignaciones30Dias.reduce(
                        (total, a) => total + (a.distancia_recorrida_km || 0), 0
                    );

                    // Score de rendimiento (0-100)
                    let scoreRendimiento = 0;
                    if (asignaciones30Dias.length > 0) {
                        scoreRendimiento = Math.round(
                            (tasaCompletacion * 0.4) + 
                            (Math.min(diasTrabajados30 / 20, 1) * 100 * 0.3) +
                            (Math.max(0, 100 - tasaCancelacion) * 0.3)
                        );
                    }

                    // Clasificación de rendimiento
                    let clasificacionRendimiento = 'sin_datos';
                    if (scoreRendimiento >= 85) clasificacionRendimiento = 'excelente';
                    else if (scoreRendimiento >= 70) clasificacionRendimiento = 'bueno';
                    else if (scoreRendimiento >= 50) clasificacionRendimiento = 'regular';
                    else if (scoreRendimiento > 0) clasificacionRendimiento = 'deficiente';

                    // Tendencia (comparar últimos 7 días vs promedio 30 días)
                    const promedioSemanal30 = diasTrabajados30 / 4.3; // 30 días / 7 días
                    const tendencia = diasTrabajados7 > promedioSemanal30 ? 'subiendo' : 
                                     diasTrabajados7 < promedioSemanal30 ? 'bajando' : 'estable';

                    return {
                        ...conductor,
                        // Datos de actividad
                        totalAsignaciones: asignacionesConductor.length,
                        asignaciones30Dias: asignaciones30Dias.length,
                        asignaciones7Dias: asignaciones7Dias.length,
                        completadas30,
                        canceladas30,
                        enProgreso,
                        
                        // Métricas de tiempo y distancia
                        diasTrabajados30,
                        diasTrabajados7,
                        horasTrabajadas30: Math.round(horasTrabajadas30 * 100) / 100,
                        horasPromedioDia: diasTrabajados30 > 0 ? Math.round((horasTrabajadas30 / diasTrabajados30) * 100) / 100 : 0,
                        kmRecorridos30: Math.round(kmRecorridos30 * 100) / 100,
                        kmPromedioDia: diasTrabajados30 > 0 ? Math.round((kmRecorridos30 / diasTrabajados30) * 100) / 100 : 0,
                        
                        // Análisis de rendimiento
                        tasaCompletacion: Math.round(tasaCompletacion * 10) / 10,
                        tasaCancelacion: Math.round(tasaCancelacion * 10) / 10,
                        scoreRendimiento,
                        clasificacionRendimiento,
                        tendencia,
                        
                        // Estado de licencia
                        diasParaVencimientoLicencia: diasParaVencimiento,
                        estadoLicencia,
                        alertaLicencia,
                        
                        // Disponibilidad y estado
                        disponibilidadPorcentaje: Math.min(100, Math.round((diasTrabajados30 / 22) * 100)), // 22 días laborales promedio
                        estadoGeneral: estadoLicencia === 'vencida' ? 'inhabilitado' : 
                                      scoreRendimiento < 50 && asignaciones30Dias.length > 0 ? 'bajo_rendimiento' : 
                                      conductor.estado_disponibilidad || 'disponible'
                    };
                });

                setConductoresEnriquecidos(conductoresConAnalytics);

                // Calcular estadísticas generales
                const stats = dashboardService.calcularEstadisticasConductores(conductoresConAnalytics, asignaciones);
                setEstadisticas(stats);

            } catch (error) {
                console.error('Error procesando datos de conductores:', error);
            }
        };

        procesarDatos();
    }, [conductores, asignaciones]);

    // Filtrar conductores
    const conductoresFiltrados = conductoresEnriquecidos.filter(conductor => {
        const coincideBusqueda = !filtros.busqueda || 
            `${conductor.nombre} ${conductor.apellido}`.toLowerCase().includes(filtros.busqueda.toLowerCase()) ||
            conductor.run?.toLowerCase().includes(filtros.busqueda.toLowerCase()) ||
            conductor.numero_licencia?.toLowerCase().includes(filtros.busqueda.toLowerCase());

        const coincideEstado = filtros.estado === 'todos' || conductor.estadoGeneral === filtros.estado;
        
        const coincideDisponibilidad = filtros.disponibilidad === 'todos' || (() => {
            switch (filtros.disponibilidad) {
                case 'alta': return conductor.disponibilidadPorcentaje >= 80;
                case 'media': return conductor.disponibilidadPorcentaje >= 50 && conductor.disponibilidadPorcentaje < 80;
                case 'baja': return conductor.disponibilidadPorcentaje < 50;
                default: return true;
            }
        })();

        const coincideLicencia = filtros.licencia === 'todos' || conductor.estadoLicencia === filtros.licencia;

        const coincideRendimiento = filtros.rendimiento === 'todos' || conductor.clasificacionRendimiento === filtros.rendimiento;

        return coincideBusqueda && coincideEstado && coincideDisponibilidad && coincideLicencia && coincideRendimiento;
    });

    // Datos para gráficos
    const datosRendimiento = {
        labels: ['Excelente', 'Bueno', 'Regular', 'Deficiente'],
        datasets: [{
            data: [
                conductoresEnriquecidos.filter(c => c.clasificacionRendimiento === 'excelente').length,
                conductoresEnriquecidos.filter(c => c.clasificacionRendimiento === 'bueno').length,
                conductoresEnriquecidos.filter(c => c.clasificacionRendimiento === 'regular').length,
                conductoresEnriquecidos.filter(c => c.clasificacionRendimiento === 'deficiente').length
            ],
            backgroundColor: ['#10b981', '#3b82f6', '#f59e0b', '#ef4444'],
            borderWidth: 0
        }]
    };

    const datosDisponibilidad = {
        labels: ['Disponible', 'Ocupado', 'Bajo Rendimiento', 'Inhabilitado'],
        datasets: [{
            data: [
                conductoresEnriquecidos.filter(c => c.estadoGeneral === 'disponible').length,
                conductoresEnriquecidos.filter(c => c.estadoGeneral === 'ocupado').length,
                conductoresEnriquecidos.filter(c => c.estadoGeneral === 'bajo_rendimiento').length,
                conductoresEnriquecidos.filter(c => c.estadoGeneral === 'inhabilitado').length
            ],
            backgroundColor: ['#10b981', '#3b82f6', '#f59e0b', '#ef4444'],
            borderWidth: 0
        }]
    };

    const datosLicencias = {
        labels: ['Vigente', 'Por Vencer', 'Vencida'],
        datasets: [{
            data: [
                conductoresEnriquecidos.filter(c => c.estadoLicencia === 'vigente').length,
                conductoresEnriquecidos.filter(c => c.estadoLicencia === 'por_vencer').length,
                conductoresEnriquecidos.filter(c => c.estadoLicencia === 'vencida').length
            ],
            backgroundColor: ['#10b981', '#f59e0b', '#ef4444'],
            borderWidth: 0
        }]
    };

    // Top performers por diferentes métricas
    const topPorHoras = [...conductoresEnriquecidos]
        .filter(c => c.horasTrabajadas30 > 0)
        .sort((a, b) => b.horasTrabajadas30 - a.horasTrabajadas30)
        .slice(0, 5);

    const topPorKm = [...conductoresEnriquecidos]
        .filter(c => c.kmRecorridos30 > 0)
        .sort((a, b) => b.kmRecorridos30 - a.kmRecorridos30)
        .slice(0, 5);

    const topPorEficiencia = [...conductoresEnriquecidos]
        .filter(c => c.tasaCompletacion > 0)
        .sort((a, b) => b.tasaCompletacion - a.tasaCompletacion)
        .slice(0, 5);

    if (loading || loadingData) {
        return (
            <div className={style.loadingContainer}>
                <div className={style.spinner}></div>
                <p>Cargando análisis de conductores...</p>
            </div>
        );
    }

    return (
        <div className={style.vistaConductores}>
            {/* Navegación entre vistas */}
            <div className={style.viewTabs}>
                <button 
                    className={`${style.viewTab} ${vistaActual === 'resumen' ? style.active : ''}`}
                    onClick={() => setVistaActual('resumen')}
                >
                    📊 Resumen Ejecutivo
                </button>
                <button 
                    className={`${style.viewTab} ${vistaActual === 'detalle' ? style.active : ''}`}
                    onClick={() => setVistaActual('detalle')}
                >
                    👥 Gestión de Conductores
                </button>
            </div>

            {vistaActual === 'resumen' ? (
                <div className={style.resumenGrid}>
                    {/* KPIs Principales */}
                    <div className={style.metricsGrid}>
                        <div className={`${style.metricCard} ${style.fadeIn}`}>
                            <div className={style.metricIcon}>👥</div>
                            <div className={style.metricContent}>
                                <div className={style.metricValue}>{conductoresEnriquecidos.length}</div>
                                <div className={style.metricLabel}>Total Conductores</div>
                                <div className={style.metricSubtext}>
                                    {conductoresEnriquecidos.filter(c => c.estadoGeneral === 'disponible').length} disponibles
                                </div>
                            </div>
                        </div>

                        <div className={`${style.metricCard} ${style.fadeIn}`}>
                            <div className={style.metricIcon}>⭐</div>
                            <div className={style.metricContent}>
                                <div className={style.metricValue}>
                                    {estadisticas ? Math.round(estadisticas.scorePromedioRendimiento) : 0}
                                </div>
                                <div className={style.metricLabel}>Score Promedio</div>
                                <div className={style.metricSubtext}>Rendimiento general</div>
                            </div>
                        </div>

                        <div className={`${style.metricCard} ${style.fadeIn}`}>
                            <div className={style.metricIcon}>🚀</div>
                            <div className={style.metricContent}>
                                <div className={style.metricValue}>
                                    {estadisticas ? Math.round(estadisticas.tasaCompletacionPromedio) : 0}%
                                </div>
                                <div className={style.metricLabel}>Tasa Completación</div>
                                <div className={style.metricSubtext}>Últimos 30 días</div>
                            </div>
                        </div>

                        <div className={`${style.metricCard} ${style.fadeIn}`}>
                            <div className={style.metricIcon}>⚠️</div>
                            <div className={style.metricContent}>
                                <div className={style.metricValue}>
                                    {conductoresEnriquecidos.filter(c => c.alertaLicencia).length}
                                </div>
                                <div className={style.metricLabel}>Alertas Licencia</div>
                                <div className={style.metricSubtext}>Requieren atención</div>
                            </div>
                        </div>

                        <div className={`${style.metricCard} ${style.fadeIn}`}>
                            <div className={style.metricIcon}>📈</div>
                            <div className={style.metricContent}>
                                <div className={style.metricValue}>
                                    {estadisticas ? Math.round(estadisticas.horasPromedioMensual) : 0}h
                                </div>
                                <div className={style.metricLabel}>Horas Promedio</div>
                                <div className={style.metricSubtext}>Por conductor/mes</div>
                            </div>
                        </div>

                        <div className={`${style.metricCard} ${style.fadeIn}`}>
                            <div className={style.metricIcon}>🛣️</div>
                            <div className={style.metricContent}>
                                <div className={style.metricValue}>
                                    {estadisticas ? Math.round(estadisticas.kmPromedioMensual) : 0}
                                </div>
                                <div className={style.metricLabel}>Km Promedio</div>
                                <div className={style.metricSubtext}>Por conductor/mes</div>
                            </div>
                        </div>
                    </div>

                    {/* Gráficos Analíticos */}
                    <div className={style.chartsGrid}>
                        <div className={style.chartCard}>
                            <h3>📊 Distribución por Rendimiento</h3>
                            <div className={style.chartContainer}>
                                <Pie data={datosRendimiento} options={{
                                    responsive: true,
                                    maintainAspectRatio: false,
                                    plugins: {
                                        legend: { position: 'bottom' }
                                    }
                                }} />
                            </div>
                        </div>

                        <div className={style.chartCard}>
                            <h3>🎯 Estado de Disponibilidad</h3>
                            <div className={style.chartContainer}>
                                <Doughnut data={datosDisponibilidad} options={{
                                    responsive: true,
                                    maintainAspectRatio: false,
                                    plugins: {
                                        legend: { position: 'bottom' }
                                    }
                                }} />
                            </div>
                        </div>

                        <div className={style.chartCard}>
                            <h3>📄 Estado de Licencias</h3>
                            <div className={style.chartContainer}>
                                <Pie data={datosLicencias} options={{
                                    responsive: true,
                                    maintainAspectRatio: false,
                                    plugins: {
                                        legend: { position: 'bottom' }
                                    }
                                }} />
                            </div>
                        </div>

                        <div className={style.chartCard}>
                            <h3>🏆 Top 5 - Horas Trabajadas</h3>
                            <div className={style.rankingList}>
                                {topPorHoras.map((conductor, index) => (
                                    <div key={conductor.id} className={style.rankingItem}>
                                        <div className={style.rankingPosition}>{index + 1}</div>
                                        <div className={style.rankingInfo}>
                                            <div className={style.rankingName}>
                                                {conductor.nombre} {conductor.apellido}
                                            </div>
                                            <div className={style.rankingValue}>
                                                {conductor.horasTrabajadas30}h
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className={style.chartCard}>
                            <h3>🚗 Top 5 - Kilómetros Recorridos</h3>
                            <div className={style.rankingList}>
                                {topPorKm.map((conductor, index) => (
                                    <div key={conductor.id} className={style.rankingItem}>
                                        <div className={style.rankingPosition}>{index + 1}</div>
                                        <div className={style.rankingInfo}>
                                            <div className={style.rankingName}>
                                                {conductor.nombre} {conductor.apellido}
                                            </div>
                                            <div className={style.rankingValue}>
                                                {conductor.kmRecorridos30} km
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className={style.chartCard}>
                            <h3>⭐ Top 5 - Eficiencia</h3>
                            <div className={style.rankingList}>
                                {topPorEficiencia.map((conductor, index) => (
                                    <div key={conductor.id} className={style.rankingItem}>
                                        <div className={style.rankingPosition}>{index + 1}</div>
                                        <div className={style.rankingInfo}>
                                            <div className={style.rankingName}>
                                                {conductor.nombre} {conductor.apellido}
                                            </div>
                                            <div className={style.rankingValue}>
                                                {conductor.tasaCompletacion}%
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className={style.detalleGrid}>
                    {/* Controles y Filtros */}
                    <div className={style.conductoresList}>
                        <div className={style.listHeader}>
                            <h3>👥 Gestión de Conductores</h3>
                            <div className={style.filtrosContainer}>
                                <input
                                    type="text"
                                    placeholder="Buscar conductor..."
                                    value={filtros.busqueda}
                                    onChange={(e) => setFiltros({...filtros, busqueda: e.target.value})}
                                    className={style.searchInput}
                                />
                                <div className={style.filtrosRapidos}>
                                    <select 
                                        value={filtros.estado} 
                                        onChange={(e) => setFiltros({...filtros, estado: e.target.value})}
                                        className={style.filterSelect}
                                    >
                                        <option value="todos">Todos los estados</option>
                                        <option value="disponible">Disponible</option>
                                        <option value="ocupado">Ocupado</option>
                                        <option value="bajo_rendimiento">Bajo Rendimiento</option>
                                        <option value="inhabilitado">Inhabilitado</option>
                                    </select>
                                    <select 
                                        value={filtros.rendimiento} 
                                        onChange={(e) => setFiltros({...filtros, rendimiento: e.target.value})}
                                        className={style.filterSelect}
                                    >
                                        <option value="todos">Todo rendimiento</option>
                                        <option value="excelente">Excelente</option>
                                        <option value="bueno">Bueno</option>
                                        <option value="regular">Regular</option>
                                        <option value="deficiente">Deficiente</option>
                                    </select>
                                    <select 
                                        value={filtros.licencia} 
                                        onChange={(e) => setFiltros({...filtros, licencia: e.target.value})}
                                        className={style.filterSelect}
                                    >
                                        <option value="todos">Todas las licencias</option>
                                        <option value="vigente">Vigente</option>
                                        <option value="por_vencer">Por Vencer</option>
                                        <option value="vencida">Vencida</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Grid de Conductores */}
                        <div className={style.conductoresGrid}>
                            {conductoresFiltrados.map(conductor => (
                                <div key={conductor.id} className={`${style.conductorCard} ${style.slideIn}`}>
                                    <div className={style.conductorHeader}>
                                        <div className={style.conductorInfo}>
                                            <h4>{conductor.nombre} {conductor.apellido}</h4>
                                            <div className={style.conductorRun}>RUN: {conductor.run}</div>
                                            <div className={style.conductorLicencia}>
                                                Lic: {conductor.numero_licencia}
                                            </div>
                                        </div>
                                        <div className={style.conductorBadges}>
                                            <span className={`${style.estadoBadge} ${style[conductor.estadoGeneral]}`}>
                                                {conductor.estadoGeneral.replace('_', ' ')}
                                            </span>
                                            <span className={`${style.rendimientoBadge} ${style[conductor.clasificacionRendimiento]}`}>
                                                {conductor.clasificacionRendimiento}
                                            </span>
                                        </div>
                                    </div>

                                    {conductor.alertaLicencia && (
                                        <div className={`${style.conductorAlerta} ${conductor.estadoLicencia === 'vencida' ? style.critico : style.atencion}`}>
                                            <span className={style.alertaIcon}>
                                                {conductor.estadoLicencia === 'vencida' ? '🚨' : '⚠️'}
                                            </span>
                                            <span className={style.alertaTexto}>{conductor.alertaLicencia}</span>
                                        </div>
                                    )}

                                    <div className={style.conductorMetrics}>
                                        <div className={style.metricaItem}>
                                            <div className={style.metricaLabel}>Score de Rendimiento</div>
                                            <div className={`${style.metricaValue} ${
                                                conductor.scoreRendimiento >= 85 ? style.bueno :
                                                conductor.scoreRendimiento >= 70 ? style.atencion : style.critico
                                            }`}>
                                                {conductor.scoreRendimiento}/100
                                            </div>
                                            <div className={style.metricaBar}>
                                                <div 
                                                    className={`${style.metricaFill} ${
                                                        conductor.scoreRendimiento >= 85 ? style.bueno :
                                                        conductor.scoreRendimiento >= 70 ? style.atencion : style.critico
                                                    }`}
                                                    style={{ width: `${conductor.scoreRendimiento}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className={style.conductorStats}>
                                        <div className={style.statItem}>
                                            <div className={style.statIcon}>📅</div>
                                            <div>
                                                <div className={style.statValue}>{conductor.diasTrabajados30}</div>
                                                <div className={style.statLabel}>Días trabajados</div>
                                            </div>
                                        </div>
                                        <div className={style.statItem}>
                                            <div className={style.statIcon}>⏱️</div>
                                            <div>
                                                <div className={style.statValue}>{conductor.horasTrabajadas30}h</div>
                                                <div className={style.statLabel}>Horas totales</div>
                                            </div>
                                        </div>
                                        <div className={style.statItem}>
                                            <div className={style.statIcon}>🛣️</div>
                                            <div>
                                                <div className={style.statValue}>{conductor.kmRecorridos30}</div>
                                                <div className={style.statLabel}>Km recorridos</div>
                                            </div>
                                        </div>
                                        <div className={style.statItem}>
                                            <div className={style.statIcon}>✅</div>
                                            <div>
                                                <div className={style.statValue}>{conductor.tasaCompletacion}%</div>
                                                <div className={style.statLabel}>Completación</div>
                                            </div>
                                        </div>
                                        <div className={style.statItem}>
                                            <div className={style.statIcon}>📋</div>
                                            <div>
                                                <div className={style.statValue}>{conductor.asignaciones30Dias}</div>
                                                <div className={style.statLabel}>Asignaciones</div>
                                            </div>
                                        </div>
                                        <div className={style.statItem}>
                                            <div className={style.statIcon}>
                                                {conductor.tendencia === 'subiendo' ? '📈' : 
                                                 conductor.tendencia === 'bajando' ? '📉' : '➡️'}
                                            </div>
                                            <div>
                                                <div className={style.statValue}>
                                                    {conductor.tendencia === 'subiendo' ? '+' : 
                                                     conductor.tendencia === 'bajando' ? '-' : '='}
                                                </div>
                                                <div className={style.statLabel}>Tendencia</div>
                                            </div>
                                        </div>
                                    </div>

                                    <button 
                                        className={style.verDetallesBtn}
                                        onClick={() => setConductorSeleccionado(conductor)}
                                    >
                                        Ver Detalles Completos
                                    </button>
                                </div>
                            ))}

                            {conductoresFiltrados.length === 0 && (
                                <div className={style.noResultados}>
                                    <h3>No se encontraron conductores</h3>
                                    <p>Intenta ajustar los filtros de búsqueda</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de detalles del conductor */}
            {conductorSeleccionado && (
                <div className={style.modalOverlay} onClick={() => setConductorSeleccionado(null)}>
                    <div className={style.modalContent} onClick={e => e.stopPropagation()}>
                        <div className={style.modalHeader}>
                            <h3>
                                👤 {conductorSeleccionado.nombre} {conductorSeleccionado.apellido}
                                <span className={style.conductorRun}>({conductorSeleccionado.run})</span>
                            </h3>
                            <button 
                                className={style.closeButton}
                                onClick={() => setConductorSeleccionado(null)}
                            >
                                ✕
                            </button>
                        </div>
                        <div className={style.modalBody}>
                            {/* Información detallada del conductor */}
                            <div className={style.infoGrid}>
                                <div className={style.infoItem}>
                                    <div className={style.infoLabel}>Estado General</div>
                                    <div className={`${style.infoValue} ${style[conductorSeleccionado.estadoGeneral]}`}>
                                        {conductorSeleccionado.estadoGeneral.replace('_', ' ')}
                                    </div>
                                </div>
                                <div className={style.infoItem}>
                                    <div className={style.infoLabel}>Número de Licencia</div>
                                    <div className={style.infoValue}>{conductorSeleccionado.numero_licencia}</div>
                                </div>
                                <div className={style.infoItem}>
                                    <div className={style.infoLabel}>Fecha Vencimiento</div>
                                    <div className={style.infoValue}>
                                        {new Date(conductorSeleccionado.fecha_vencimiento_licencia).toLocaleDateString()}
                                    </div>
                                </div>
                                <div className={style.infoItem}>
                                    <div className={style.infoLabel}>Días para Vencimiento</div>
                                    <div className={`${style.infoValue} ${
                                        conductorSeleccionado.diasParaVencimientoLicencia < 0 ? style.critico :
                                        conductorSeleccionado.diasParaVencimientoLicencia <= 30 ? style.atencion : style.bueno
                                    }`}>
                                        {conductorSeleccionado.diasParaVencimientoLicencia} días
                                    </div>
                                </div>
                                <div className={style.infoItem}>
                                    <div className={style.infoLabel}>Score de Rendimiento</div>
                                    <div className={`${style.infoValue} ${
                                        conductorSeleccionado.scoreRendimiento >= 85 ? style.bueno :
                                        conductorSeleccionado.scoreRendimiento >= 70 ? style.atencion : style.critico
                                    }`}>
                                        {conductorSeleccionado.scoreRendimiento}/100
                                    </div>
                                </div>
                                <div className={style.infoItem}>
                                    <div className={style.infoLabel}>Clasificación</div>
                                    <div className={style.infoValue}>{conductorSeleccionado.clasificacionRendimiento}</div>
                                </div>
                            </div>

                            {/* Métricas detalladas */}
                            <div className={style.detallesSection}>
                                <h4>📊 Métricas de Rendimiento (30 días)</h4>
                                <div className={style.metricasDetalle}>
                                    <div className={style.metricaDetalle}>
                                        <span>Total Asignaciones:</span>
                                        <strong>{conductorSeleccionado.asignaciones30Dias}</strong>
                                    </div>
                                    <div className={style.metricaDetalle}>
                                        <span>Completadas:</span>
                                        <strong>{conductorSeleccionado.completadas30}</strong>
                                    </div>
                                    <div className={style.metricaDetalle}>
                                        <span>Canceladas:</span>
                                        <strong>{conductorSeleccionado.canceladas30}</strong>
                                    </div>
                                    <div className={style.metricaDetalle}>
                                        <span>Tasa Completación:</span>
                                        <strong>{conductorSeleccionado.tasaCompletacion}%</strong>
                                    </div>
                                    <div className={style.metricaDetalle}>
                                        <span>Días Trabajados:</span>
                                        <strong>{conductorSeleccionado.diasTrabajados30} días</strong>
                                    </div>
                                    <div className={style.metricaDetalle}>
                                        <span>Horas Trabajadas:</span>
                                        <strong>{conductorSeleccionado.horasTrabajadas30} horas</strong>
                                    </div>
                                    <div className={style.metricaDetalle}>
                                        <span>Promedio Horas/Día:</span>
                                        <strong>{conductorSeleccionado.horasPromedioDia} h/día</strong>
                                    </div>
                                    <div className={style.metricaDetalle}>
                                        <span>Km Recorridos:</span>
                                        <strong>{conductorSeleccionado.kmRecorridos30} km</strong>
                                    </div>
                                    <div className={style.metricaDetalle}>
                                        <span>Promedio Km/Día:</span>
                                        <strong>{conductorSeleccionado.kmPromedioDia} km/día</strong>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default VistaConductores;
 