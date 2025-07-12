import { h } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import { motion, AnimatePresence } from 'framer-motion';
import style from './style.css';
import DashboardFilters from '../../components/DashboardFilters';
import KPICard from '../../components/KPICard';
import Chart from '../../components/Chart';
import MapaAsignaciones from '../../components/MapaAsignaciones';
import { getDashboardStats, calculateKPIs, processChartData } from '../../services/dashboardService';

const MantenimientoPage = () => {
    const [activeTab, setActiveTab] = useState(0);
    const [dashboardData, setDashboardData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [filtros, setFiltros] = useState({});
    const [chartInstances, setChartInstances] = useState({});

    const tabs = [
        { id: 0, name: 'Vista General', icon: '📊' },
        { id: 1, name: 'Vehículos', icon: '🚗' },
        { id: 2, name: 'Conductores', icon: '👥' },
        { id: 3, name: 'Mapa de Asignaciones', icon: '🗺️' },
        { id: 4, name: 'Control de Horarios', icon: '⏰' }
    ];

    useEffect(() => {
        loadDashboardData();
    }, [filtros]);

    const loadDashboardData = async () => {
        try {
            setIsLoading(true);
            const data = await getDashboardStats(filtros);
            setDashboardData(data);
        } catch (error) {
            console.error('Error loading dashboard data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleFiltersChange = (newFiltros) => {
        setFiltros(newFiltros);
    };

    const renderVistaGeneral = () => {
        const kpis = dashboardData ? calculateKPIs(dashboardData) : {};
        
        return (
            <motion.div 
                className={style.vistaGeneral}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
            >
                {/* KPI Cards */}
                <div className={style.kpiGrid}>
                    <KPICard 
                        title="Eficiencia de Flota"
                        value={kpis.eficiencia_flota?.valor || 0}
                        unit={kpis.eficiencia_flota?.unidad}
                        trend={kpis.eficiencia_flota?.tendencia}
                        description={kpis.eficiencia_flota?.descripcion}
                        icon="⚡"
                        color="primary"
                        isLoading={isLoading}
                    />
                    <KPICard 
                        title="Utilización de Vehículos"
                        value={kpis.utilizacion_vehiculos?.valor || 0}
                        unit={kpis.utilizacion_vehiculos?.unidad}
                        trend={kpis.utilizacion_vehiculos?.tendencia}
                        description={kpis.utilizacion_vehiculos?.descripcion}
                        icon="🚗"
                        color="success"
                        isLoading={isLoading}
                    />
                    <KPICard 
                        title="Distancia Promedio"
                        value={kpis.distancia_promedio?.valor || 0}
                        unit={kpis.distancia_promedio?.unidad}
                        trend={kpis.distancia_promedio?.tendencia}
                        description={kpis.distancia_promedio?.descripcion}
                        icon="📏"
                        color="info"
                        isLoading={isLoading}
                    />
                    <KPICard 
                        title="Conductores Activos"
                        value={kpis.conductores_activos?.valor || 0}
                        unit={kpis.conductores_activos?.unidad}
                        trend={kpis.conductores_activos?.tendencia}
                        description={kpis.conductores_activos?.descripcion}
                        icon="👥"
                        color="warning"
                        isLoading={isLoading}
                    />
                </div>

                {/* Gráficos de tendencias */}
                <div className={style.chartsGrid}>
                    <div className={`card ${style.chartCard}`}>
                        <h3>Tendencias Temporales</h3>
                        <div className={style.chartContainer}>
                            {dashboardData?.tendencias && (
                                <Chart
                                    type="line"
                                    data={getTendenciasChartData(dashboardData.tendencias)}
                                    options={{
                                        plugins: {
                                            title: {
                                                display: true,
                                                text: 'Asignaciones por Período'
                                            }
                                        }
                                    }}
                                />
                            )}
                        </div>
                    </div>

                    <div className={`card ${style.chartCard}`}>
                        <h3>Estado de Asignaciones</h3>
                        <div className={style.chartContainer}>
                            {dashboardData?.general && (
                                <Chart
                                    type="doughnut"
                                    data={getEstadosChartData(dashboardData.general)}
                                    options={{
                                        plugins: {
                                            title: {
                                                display: true,
                                                text: 'Distribución por Estado'
                                            }
                                        }
                                    }}
                                />
                            )}
                        </div>
                    </div>
                </div>

                {/* Resumen estadístico */}
                <div className={`card ${style.summaryCard}`}>
                    <h3>Resumen del Período</h3>
                    {dashboardData?.general && (
                        <div className={style.summaryGrid}>
                            <div className={style.summaryItem}>
                                <span className={style.summaryLabel}>Total Asignaciones</span>
                                <span className={style.summaryValue}>{dashboardData.general.total_asignaciones}</span>
                            </div>
                            <div className={style.summaryItem}>
                                <span className={style.summaryLabel}>Distancia Total</span>
                                <span className={style.summaryValue}>{dashboardData.general.distancia_total_km} km</span>
                            </div>
                            <div className={style.summaryItem}>
                                <span className={style.summaryLabel}>Vehículos Utilizados</span>
                                <span className={style.summaryValue}>{dashboardData.general.vehiculos_utilizados}</span>
                            </div>
                            <div className={style.summaryItem}>
                                <span className={style.summaryLabel}>Conductores Activos</span>
                                <span className={style.summaryValue}>{dashboardData.general.conductores_utilizados}</span>
                            </div>
                        </div>
                    )}
                </div>
            </motion.div>
        );
    };

    const renderVistaVehiculos = () => {
        return (
            <motion.div 
                className={style.vistaVehiculos}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
            >
                <div className={style.chartsGrid}>
                    <div className={`card ${style.chartCard}`}>
                        <h3>Uso por Vehículo</h3>
                        <div className={style.chartContainer}>
                            {dashboardData?.vehiculos?.uso_por_vehiculo && (
                                <Chart
                                    type="bar"
                                    data={getUsoVehiculosChartData(dashboardData.vehiculos.uso_por_vehiculo)}
                                    options={{
                                        plugins: {
                                            title: {
                                                display: true,
                                                text: 'Viajes por Vehículo (Top 10)'
                                            }
                                        },
                                        indexAxis: 'y'
                                    }}
                                />
                            )}
                        </div>
                    </div>

                    <div className={`card ${style.chartCard}`}>
                        <h3>Distribución por Tipo</h3>
                        <div className={style.chartContainer}>
                            {dashboardData?.vehiculos?.distribucion_tipo && (
                                <Chart
                                    type="pie"
                                    data={getTipoVehiculosChartData(dashboardData.vehiculos.distribucion_tipo)}
                                    options={{
                                        plugins: {
                                            title: {
                                                display: true,
                                                text: 'Asignaciones por Tipo de Vehículo'
                                            }
                                        }
                                    }}
                                />
                            )}
                        </div>
                    </div>

                    <div className={`card ${style.chartCard}`}>
                        <h3>Estado de la Flota</h3>
                        <div className={style.chartContainer}>
                            {dashboardData?.vehiculos?.estado_flota && (
                                <Chart
                                    type="doughnut"
                                    data={getEstadoFlotaChartData(dashboardData.vehiculos.estado_flota)}
                                    options={{
                                        plugins: {
                                            title: {
                                                display: true,
                                                text: 'Estado Actual de la Flota'
                                            }
                                        }
                                    }}
                                />
                            )}
                        </div>
                    </div>
                </div>

                {/* Nueva sección: Estadísticas de Mantenimiento */}
                <div className={`card ${style.chartCard}`}>
                    <h3>Estado de Mantenimiento</h3>
                    <div className={style.chartContainer}>
                        {dashboardData?.vehiculos?.estadisticas_mantenimiento && (
                            <Chart
                                type="bar"
                                data={getMantenimientoStatsChartData(dashboardData.vehiculos.estadisticas_mantenimiento)}
                                options={{
                                    plugins: {
                                        title: {
                                            display: true,
                                            text: 'Distribución por Estado de Mantenimiento'
                                        }
                                    }
                                }}
                            />
                        )}
                    </div>
                </div>

                {/* Nueva sección: Análisis Detallado de Mantenimiento */}
                <div className={`card ${style.maintenanceAnalysisCard}`}>
                    <h3>📋 Análisis Detallado de Mantenimiento</h3>
                    {dashboardData?.vehiculos?.analisis_mantenimiento && dashboardData.vehiculos.analisis_mantenimiento.length > 0 ? (
                        <div className={style.maintenanceAnalysis}>
                            {dashboardData.vehiculos.analisis_mantenimiento.slice(0, 10).map((vehiculo, index) => (
                                <div key={vehiculo.id} className={`${style.maintenanceItem} ${style[`priority-${vehiculo.mantenimiento.prioridad}`]}`}>
                                    <div className={style.vehicleInfo}>
                                        <h4>{vehiculo.patente} - {vehiculo.marca} {vehiculo.modelo}</h4>
                                        <span className={`badge ${style[`status-${vehiculo.mantenimiento.estado}`]}`}>
                                            {vehiculo.mantenimiento.estado.toUpperCase()}
                                        </span>
                                        <p>Kilometraje: {vehiculo.kilometraje_actual.toLocaleString()} km</p>
                                    </div>
                                    
                                    <div className={style.maintenanceProgress}>
                                        <div className={style.progressItem}>
                                            <label>Mantenimiento Menor ({vehiculo.mantenimiento.menor.intervalo.toLocaleString()} km)</label>
                                            <div className={style.progressBar}>
                                                <div 
                                                    className={`${style.progressFill} ${vehiculo.mantenimiento.menor.progreso >= 90 ? style.urgent : vehiculo.mantenimiento.menor.progreso >= 75 ? style.warning : style.normal}`}
                                                    style={{ width: `${Math.min(vehiculo.mantenimiento.menor.progreso, 100)}%` }}
                                                ></div>
                                            </div>
                                            <span className={style.progressText}>
                                                {vehiculo.mantenimiento.menor.progreso}% - Faltan {vehiculo.mantenimiento.menor.km_hasta_proximo.toLocaleString()} km
                                            </span>
                                        </div>
                                        
                                        <div className={style.progressItem}>
                                            <label>Mantenimiento Mayor ({vehiculo.mantenimiento.mayor.intervalo.toLocaleString()} km)</label>
                                            <div className={style.progressBar}>
                                                <div 
                                                    className={`${style.progressFill} ${vehiculo.mantenimiento.mayor.progreso >= 90 ? style.urgent : vehiculo.mantenimiento.mayor.progreso >= 75 ? style.warning : style.normal}`}
                                                    style={{ width: `${Math.min(vehiculo.mantenimiento.mayor.progreso, 100)}%` }}
                                                ></div>
                                            </div>
                                            <span className={style.progressText}>
                                                {vehiculo.mantenimiento.mayor.progreso}% - Faltan {vehiculo.mantenimiento.mayor.km_hasta_proximo.toLocaleString()} km
                                            </span>
                                        </div>
                                        
                                        {vehiculo.mantenimiento.critico.superado && (
                                            <div className={`${style.progressItem} ${style.critical}`}>
                                                <label>⚠️ LÍMITE CRÍTICO SUPERADO</label>
                                                <p>Límite: {vehiculo.mantenimiento.critico.limite.toLocaleString()} km</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className={style.noDataMessage}>No hay datos de mantenimiento disponibles.</p>
                    )}
                </div>

                {/* Nueva sección: Planificador de Mantenimiento */}
                <div className={`card ${style.maintenancePlannerCard}`}>
                    <h3>🗓️ Planificador de Mantenimiento</h3>
                    {dashboardData?.vehiculos?.analisis_mantenimiento && (
                        <div className={style.maintenancePlanner}>
                            <div className={style.plannerFilters}>
                                <button className={`btn btn-sm ${style.filterBtn} ${style.active}`}>
                                    🔴 Críticos ({dashboardData.vehiculos.estadisticas_mantenimiento?.criticos || 0})
                                </button>
                                <button className={`btn btn-sm ${style.filterBtn}`}>
                                    🟡 Urgentes ({dashboardData.vehiculos.estadisticas_mantenimiento?.urgentes || 0})
                                </button>
                                <button className={`btn btn-sm ${style.filterBtn}`}>
                                    🟢 Próximos ({dashboardData.vehiculos.estadisticas_mantenimiento?.proximos || 0})
                                </button>
                            </div>
                            
                            <div className={style.plannerCalendar}>
                                {dashboardData.vehiculos.analisis_mantenimiento
                                    .filter(v => v.mantenimiento.prioridad === 'critico' || v.mantenimiento.prioridad === 'urgente')
                                    .slice(0, 5)
                                    .map((vehiculo, index) => (
                                    <div key={vehiculo.id} className={`${style.plannerItem} ${style[`priority-${vehiculo.mantenimiento.prioridad}`]}`}>
                                        <div className={style.plannerDate}>
                                            <div className={style.dayNumber}>
                                                {new Date(Date.now() + (index * 7 * 24 * 60 * 60 * 1000)).getDate()}
                                            </div>
                                            <div className={style.monthName}>
                                                {new Date(Date.now() + (index * 7 * 24 * 60 * 60 * 1000)).toLocaleDateString('es-ES', { month: 'short' })}
                                            </div>
                                        </div>
                                        <div className={style.plannerDetails}>
                                            <h5>{vehiculo.patente} - {vehiculo.marca} {vehiculo.modelo}</h5>
                                            <p className={style.maintenanceType}>
                                                {vehiculo.mantenimiento.menor.progreso >= 90 ? 'Mantenimiento Menor' : 'Mantenimiento Mayor'}
                                            </p>
                                            <div className={style.plannerActions}>
                                                <button className="btn btn-sm btn-primary">📅 Programar</button>
                                                <button className="btn btn-sm btn-outline-secondary">👁️ Detalles</button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Nueva sección: Análisis de Costos */}
                <div className={`card ${style.costAnalysisCard}`}>
                    <h3>💰 Análisis de Costos de Mantenimiento</h3>
                    <div className={style.costGrid}>
                        <div className={style.costItem}>
                            <div className={style.costIcon}>🔧</div>
                            <div className={style.costDetails}>
                                <h4>Mantenimiento Preventivo</h4>
                                <p className={style.costAmount}>$850.000</p>
                                <span className={style.costPeriod}>Este mes</span>
                            </div>
                        </div>
                        <div className={style.costItem}>
                            <div className={style.costIcon}>⚠️</div>
                            <div className={style.costDetails}>
                                <h4>Reparaciones Urgentes</h4>
                                <p className={style.costAmount}>$1.250.000</p>
                                <span className={style.costPeriod}>Este mes</span>
                            </div>
                        </div>
                        <div className={style.costItem}>
                            <div className={style.costIcon}>📊</div>
                            <div className={style.costDetails}>
                                <h4>Promedio por Vehículo</h4>
                                <p className={style.costAmount}>$125.000</p>
                                <span className={style.costPeriod}>Mensual</span>
                            </div>
                        </div>
                        <div className={style.costItem}>
                            <div className={style.costIcon}>📈</div>
                            <div className={style.costDetails}>
                                <h4>Proyección Anual</h4>
                                <p className={style.costAmount}>$15.000.000</p>
                                <span className={style.costPeriod}>Estimado</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div className={`card ${style.maintenanceCard}`}>
                    <h3>⚠️ Vehículos que Requieren Mantenimiento</h3>
                    {dashboardData?.vehiculos?.vehiculos_necesitan_mantenimiento?.length > 0 ? (
                        <div className={style.maintenanceTable}>
                            <table>
                                <thead>
                                    <tr>
                                        <th>Patente</th>
                                        <th>Marca/Modelo</th>
                                        <th>Kilometraje</th>
                                        <th>Estado</th>
                                        <th>Acción</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {dashboardData.vehiculos.vehiculos_necesitan_mantenimiento.map((vehiculo, index) => (
                                        <tr key={index}>
                                            <td>{vehiculo.patente}</td>
                                            <td>{vehiculo.marca} {vehiculo.modelo}</td>
                                            <td>{vehiculo.kilometraje} km</td>
                                            <td>
                                                <span className={`badge ${vehiculo.estado === 'mantenimiento' ? 'badge-warning' : 'badge-danger'}`}>
                                                    {vehiculo.estado}
                                                </span>
                                            </td>
                                            <td>
                                                <button className="btn btn-sm btn-outline-primary">
                                                    Programar Mantenimiento
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <p className={style.noDataMessage}>No hay vehículos que requieran mantenimiento inmediato.</p>
                    )}
                </div>
            </motion.div>
        );
    };

    const renderVistaConductores = () => {
        return (
            <motion.div 
                className={style.vistaConductores}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
            >
                <div className={style.chartsGrid}>
                    <div className={`card ${style.chartCard}`}>
                        <h3>Desempeño por Conductor</h3>
                        <div className={style.chartContainer}>
                            {dashboardData?.conductores?.desempeño_conductores && (
                                <Chart
                                    type="bar"
                                    data={getDesempeñoConductoresChartData(dashboardData.conductores.desempeño_conductores)}
                                    options={{
                                        plugins: {
                                            title: {
                                                display: true,
                                                text: 'Total de Viajes por Conductor (Top 10)'
                                            }
                                        }
                                    }}
                                />
                            )}
                        </div>
                    </div>

                    <div className={`card ${style.chartCard}`}>
                        <h3>Estado de Conductores</h3>
                        <div className={style.chartContainer}>
                            {dashboardData?.conductores?.estado_conductores && (
                                <Chart
                                    type="doughnut"
                                    data={getEstadoConductoresChartData(dashboardData.conductores.estado_conductores)}
                                    options={{
                                        plugins: {
                                            title: {
                                                display: true,
                                                text: 'Disponibilidad de Conductores'
                                            }
                                        }
                                    }}
                                />
                            )}
                        </div>
                    </div>
                </div>

                {/* Nueva sección: Análisis de Horarios */}
                <div className={`card ${style.chartCard}`}>
                    <h3>Eficiencia Horarios</h3>
                    <div className={style.chartContainer}>
                        {dashboardData?.conductores?.estadisticas_horarios && (
                            <Chart
                                type="bar"
                                data={getHorariosStatsChartData(dashboardData.conductores.estadisticas_horarios)}
                                options={{
                                    plugins: {
                                        title: {
                                            display: true,
                                            text: 'Distribución por Estado de Trabajo'
                                        }
                                    }
                                }}
                            />
                        )}
                    </div>
                </div>
            </motion.div>
        );
    };

    const renderVistaMapa = () => {
        return (
            <motion.div 
                className={style.vistaMapa}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
            >
                <div className={`card ${style.mapCard}`}>
                    <div className={style.mapHeader}>
                        <h3>🗺️ Mapa de Asignaciones en Tiempo Real</h3>
                        <p>Visualización interactiva de todas las asignaciones con coordenadas</p>
                    </div>
                    
                    {dashboardData?.mapa?.asignaciones_con_coordenadas ? (
                        <MapaAsignaciones 
                            assignments={dashboardData.mapa.asignaciones_con_coordenadas}
                        />
                    ) : (
                        <div className={style.mapPlaceholder}>
                            <div className={style.mapPlaceholderContent}>
                                <h4>⏳ Cargando datos del mapa...</h4>
                                <p>Esperando información de asignaciones con coordenadas.</p>
                                <button 
                                    className="btn btn-primary"
                                    onClick={() => loadDashboardData()}
                                >
                                    🔄 Recargar Datos
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </motion.div>
        );
    };

    // Funciones para procesar datos de gráficos
    const getTendenciasChartData = (data) => {
        if (!data || data.length === 0) return { labels: [], datasets: [] };
        
        return {
            labels: data.map(item => {
                const date = new Date(item.periodo);
                return date.toLocaleDateString();
            }),
            datasets: [
                {
                    label: 'Total Asignaciones',
                    data: data.map(item => item.total_asignaciones),
                    borderColor: '#007bff',
                    backgroundColor: 'rgba(0, 123, 255, 0.1)',
                    tension: 0.1
                },
                {
                    label: 'Completadas',
                    data: data.map(item => item.completadas),
                    borderColor: '#28a745',
                    backgroundColor: 'rgba(40, 167, 69, 0.1)',
                    tension: 0.1
                },
                {
                    label: 'Canceladas',
                    data: data.map(item => item.canceladas),
                    borderColor: '#dc3545',
                    backgroundColor: 'rgba(220, 53, 69, 0.1)',
                    tension: 0.1
                }
            ]
        };
    };

    const getEstadosChartData = (general) => {
        return {
            labels: ['Completadas', 'Activas', 'Canceladas', 'Otras'],
            datasets: [{
                data: [
                    general.asignaciones_completadas,
                    general.asignaciones_activas,
                    general.asignaciones_canceladas,
                    general.total_asignaciones - general.asignaciones_completadas - general.asignaciones_activas - general.asignaciones_canceladas
                ],
                backgroundColor: [
                    '#28a745',
                    '#007bff',
                    '#dc3545',
                    '#6c757d'
                ]
            }]
        };
    };

    const getUsoVehiculosChartData = (data) => {
        if (!data || data.length === 0) return { labels: [], datasets: [] };
        
        return {
            labels: data.map(item => item.vehiculo__patente),
            datasets: [{
                label: 'Total Viajes',
                data: data.map(item => item.total_viajes),
                backgroundColor: '#007bff'
            }]
        };
    };

    const getTipoVehiculosChartData = (data) => {
        if (!data || data.length === 0) return { labels: [], datasets: [] };
        
        return {
            labels: data.map(item => item.vehiculo__tipo_vehiculo || 'No especificado'),
            datasets: [{
                data: data.map(item => item.count),
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
    };

    const getEstadoFlotaChartData = (data) => {
        if (!data || data.length === 0) return { labels: [], datasets: [] };
        
        const estadoLabels = {
            'disponible': 'Disponible',
            'en_uso': 'En Uso',
            'mantenimiento': 'Mantenimiento',
            'reservado': 'Reservado'
        };
        
        return {
            labels: data.map(item => estadoLabels[item.estado] || item.estado),
            datasets: [{
                data: data.map(item => item.count),
                backgroundColor: [
                    '#28a745',
                    '#007bff',
                    '#ffc107',
                    '#17a2b8'
                ]
            }]
        };
    };

    const getDesempeñoConductoresChartData = (data) => {
        if (!data || data.length === 0) return { labels: [], datasets: [] };
        
        return {
            labels: data.map(item => `${item.conductor__nombre} ${item.conductor__apellido}`),
            datasets: [{
                label: 'Total Viajes',
                data: data.map(item => item.total_viajes),
                backgroundColor: '#36A2EB'
            }]
        };
    };

    const getEstadoConductoresChartData = (data) => {
        if (!data || data.length === 0) return { labels: [], datasets: [] };
        
        const estadoLabels = {
            'disponible': 'Disponible',
            'en_ruta': 'En Ruta',
            'dia_libre': 'Día Libre',
            'no_disponible': 'No Disponible'
        };
        
        return {
            labels: data.map(item => estadoLabels[item.estado_disponibilidad] || item.estado_disponibilidad),
            datasets: [{
                data: data.map(item => item.count),
                backgroundColor: [
                    '#28a745',
                    '#007bff',
                    '#6c757d',
                    '#dc3545'
                ]
            }]
        };
    };

    const getMantenimientoStatsChartData = (data) => {
        if (!data) return { labels: [], datasets: [] };
        
        const labels = ['Críticos', 'Urgentes', 'Próximos', 'Menor Urgente', 'OK'];
        const values = [data.criticos, data.urgentes, data.proximos, data.menor_urgente, data.ok];
        const colors = ['#dc3545', '#fd7e14', '#ffc107', '#17a2b8', '#28a745'];
        
        return {
            labels: labels,
            datasets: [{
                label: 'Vehículos',
                data: values,
                backgroundColor: colors,
                borderColor: colors.map(color => color + '80'),
                borderWidth: 1
            }]
        };
    };

    const getHorariosStatsChartData = (data) => {
        if (!data) return { labels: [], datasets: [] };
        
        const labels = ['Completos', 'Regulares', 'Bajos', 'Inactivos'];
        const values = [data.completos, data.regulares, data.bajos, data.inactivos];
        const colors = ['#28a745', '#17a2b8', '#ffc107', '#dc3545'];
        
        return {
            labels: labels,
            datasets: [{
                label: 'Conductores',
                data: values,
                backgroundColor: colors,
                borderColor: colors.map(color => color + '80'),
                borderWidth: 1
            }]
        };
    };

    const renderVistaHorarios = () => {
        return (
            <motion.div 
                className={style.tabContent}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
            >
                <div className={style.scheduleHeader}>
                    <h2>⏰ Control de Horarios y Asignaciones</h2>
                    <div className={style.scheduleFilters}>
                        <button className="btn btn-primary">📊 Hoy</button>
                        <button className="btn btn-outline-primary">📅 Semana</button>
                        <button className="btn btn-outline-primary">🗓️ Mes</button>
                    </div>
                </div>

                {/* Vista del Día */}
                <div className={`card ${style.dayViewCard}`}>
                    <h3>🌅 Vista del Día - {new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</h3>
                    <div className={style.scheduleGrid}>
                        <div className={style.timeColumn}>
                            {Array.from({ length: 12 }, (_, i) => 6 + i).map(hour => (
                                <div key={hour} className={style.timeSlot}>
                                    <span className={style.timeLabel}>{hour.toString().padStart(2, '0')}:00</span>
                                </div>
                            ))}
                        </div>
                        <div className={style.vehicleColumns}>
                            {dashboardData?.vehiculos?.analisis_mantenimiento?.slice(0, 4).map((vehiculo, index) => (
                                <div key={vehiculo.id} className={style.vehicleColumn}>
                                    <div className={style.vehicleHeader}>
                                        <h5>{vehiculo.patente}</h5>
                                        <span className={`badge ${style.statusBadge} ${style[`status-${vehiculo.estado}`]}`}>
                                            {vehiculo.estado}
                                        </span>
                                    </div>
                                    <div className={style.timeSlots}>
                                        {/* Simulación de asignaciones */}
                                        {index === 0 && (
                                            <>
                                                <div className={`${style.assignment} ${style.activeAssignment}`} style={{ top: '60px', height: '120px' }}>
                                                    <small>08:00 - 10:00</small>
                                                    <strong>Ruta Centro</strong>
                                                    <span>Juan Pérez</span>
                                                </div>
                                                <div className={`${style.assignment} ${style.scheduledAssignment}`} style={{ top: '240px', height: '180px' }}>
                                                    <small>12:00 - 15:00</small>
                                                    <strong>Ruta Norte</strong>
                                                    <span>María García</span>
                                                </div>
                                            </>
                                        )}
                                        {index === 1 && (
                                            <div className={`${style.assignment} ${style.maintenanceAssignment}`} style={{ top: '120px', height: '240px' }}>
                                                <small>09:00 - 13:00</small>
                                                <strong>🔧 Mantenimiento</strong>
                                                <span>Taller Principal</span>
                                            </div>
                                        )}
                                        {index === 2 && (
                                            <div className={`${style.assignment} ${style.scheduledAssignment}`} style={{ top: '180px', height: '120px' }}>
                                                <small>11:00 - 13:00</small>
                                                <strong>Ruta Sur</strong>
                                                <span>Carlos López</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Estadísticas de Horarios */}
                <div className="row">
                    <div className="col-md-6">
                        <div className={`card ${style.scheduleStatsCard}`}>
                            <h3>📊 Estadísticas de Uso</h3>
                            <div className={style.statsList}>
                                <div className={style.statItem}>
                                    <span className={style.statLabel}>Horas Activas Promedio</span>
                                    <span className={style.statValue}>8.5h</span>
                                    <div className={style.statBar}>
                                        <div className={style.statProgress} style={{ width: '85%' }}></div>
                                    </div>
                                </div>
                                <div className={style.statItem}>
                                    <span className={style.statLabel}>Utilización de Flota</span>
                                    <span className={style.statValue}>76%</span>
                                    <div className={style.statBar}>
                                        <div className={style.statProgress} style={{ width: '76%' }}></div>
                                    </div>
                                </div>
                                <div className={style.statItem}>
                                    <span className={style.statLabel}>Tiempo en Mantenimiento</span>
                                    <span className={style.statValue}>12%</span>
                                    <div className={style.statBar}>
                                        <div className={style.statProgress} style={{ width: '12%', backgroundColor: '#ff6b6b' }}></div>
                                    </div>
                                </div>
                                <div className={style.statItem}>
                                    <span className={style.statLabel}>Eficiencia Operacional</span>
                                    <span className={style.statValue}>92%</span>
                                    <div className={style.statBar}>
                                        <div className={style.statProgress} style={{ width: '92%', backgroundColor: '#51cf66' }}></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="col-md-6">
                        <div className={`card ${style.upcomingScheduleCard}`}>
                            <h3>⏭️ Próximas Asignaciones</h3>
                            <div className={style.upcomingList}>
                                <div className={style.upcomingItem}>
                                    <div className={style.upcomingTime}>
                                        <span className={style.timeHour}>14:30</span>
                                        <span className={style.timeDate}>Hoy</span>
                                    </div>
                                    <div className={style.upcomingDetails}>
                                        <h5>ABC-123 → Ruta Poniente</h5>
                                        <p>Ana Martínez · 3.5 hrs estimadas</p>
                                    </div>
                                    <div className={style.upcomingActions}>
                                        <button className="btn btn-sm btn-outline-primary">Editar</button>
                                    </div>
                                </div>
                                <div className={style.upcomingItem}>
                                    <div className={style.upcomingTime}>
                                        <span className={style.timeHour}>09:00</span>
                                        <span className={style.timeDate}>Mañana</span>
                                    </div>
                                    <div className={style.upcomingDetails}>
                                        <h5>XYZ-789 → Mantenimiento Menor</h5>
                                        <p>Taller Central · 2 hrs estimadas</p>
                                    </div>
                                    <div className={style.upcomingActions}>
                                        <button className="btn btn-sm btn-outline-warning">Reprogramar</button>
                                    </div>
                                </div>
                                <div className={style.upcomingItem}>
                                    <div className={style.upcomingTime}>
                                        <span className={style.timeHour}>11:15</span>
                                        <span className={style.timeDate}>Mañana</span>
                                    </div>
                                    <div className={style.upcomingDetails}>
                                        <h5>DEF-456 → Ruta Centro</h5>
                                        <p>Roberto Silva · 4 hrs estimadas</p>
                                    </div>
                                    <div className={style.upcomingActions}>
                                        <button className="btn btn-sm btn-outline-primary">Editar</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Optimización de Horarios */}
                <div className={`card ${style.optimizationCard}`}>
                    <h3>🎯 Optimización de Horarios</h3>
                    <div className={style.optimizationGrid}>
                        <div className={style.optimizationMetric}>
                            <div className={style.metricIcon}>⚡</div>
                            <div className={style.metricContent}>
                                <h4>Tiempo Muerto</h4>
                                <p className={style.metricValue}>2.3 hrs/día</p>
                                <span className={style.metricTrend}>↓ -15% vs mes anterior</span>
                            </div>
                        </div>
                        <div className={style.optimizationMetric}>
                            <div className={style.metricIcon}>🔄</div>
                            <div className={style.metricContent}>
                                <h4>Rotación de Conductores</h4>
                                <p className={style.metricValue}>1.2 cambios/vehículo</p>
                                <span className={style.metricTrend}>↑ +8% vs mes anterior</span>
                            </div>
                        </div>
                        <div className={style.optimizationMetric}>
                            <div className={style.metricIcon}>📍</div>
                            <div className={style.metricContent}>
                                <h4>Km Promedio/Hora</h4>
                                <p className={style.metricValue}>25.6 km</p>
                                <span className={style.metricTrend}>↑ +3% vs mes anterior</span>
                            </div>
                        </div>
                        <div className={style.optimizationMetric}>
                            <div className={style.metricIcon}>💡</div>
                            <div className={style.metricContent}>
                                <h4>Ahorro Potencial</h4>
                                <p className={style.metricValue}>$340.000</p>
                                <span className={style.metricTrend}>Optimizando rutas</span>
                            </div>
                        </div>
                    </div>
                    <div className={style.optimizationActions}>
                        <button className="btn btn-success">🚀 Aplicar Optimización Automática</button>
                        <button className="btn btn-outline-info">📊 Ver Recomendaciones Detalladas</button>
                    </div>
                </div>
            </motion.div>
        );
    };

    const renderActiveTab = () => {
        switch (activeTab) {
            case 0:
                return renderVistaGeneral();
            case 1:
                return renderVistaVehiculos();
            case 2:
                return renderVistaConductores();
            case 3:
                return renderVistaMapa();
            case 4:
                return renderVistaHorarios();
            default:
                return renderVistaGeneral();
        }
    };

    return (
        <motion.div 
            className={style.mantenimientoPage}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
        >
            <div className="page-header">
                <h1 className="page-title">Dashboard de Análisis y Mantenimiento</h1>
                <p className="page-subtitle">Análisis completo de operaciones, uso de vehículos y desempeño de conductores.</p>
            </div>

            {/* Filtros */}
            <DashboardFilters onFiltersChange={handleFiltersChange} isLoading={isLoading} />

            {/* Navegación por pestañas */}
            <div className={style.tabNavigation}>
                <div className={style.tabButtons}>
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            className={`${style.tabButton} ${activeTab === tab.id ? style.active : ''}`}
                            onClick={() => setActiveTab(tab.id)}
                        >
                            <span className={style.tabIcon}>{tab.icon}</span>
                            <span className={style.tabName}>{tab.name}</span>
                            {tab.id === 3 && dashboardData?.mapa?.asignaciones_con_coordenadas?.length > 0 && (
                                <span className={style.tabBadge}>
                                    {dashboardData.mapa.asignaciones_con_coordenadas.length}
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                <div className={style.dashboardActions}>
                    <button 
                        className="btn btn-outline-primary"
                        onClick={() => loadDashboardData()}
                        disabled={isLoading}
                        title="Actualizar datos del dashboard"
                    >
                        {isLoading ? '🔄' : '🔄'} Actualizar
                    </button>
                    <button 
                        className="btn btn-outline-secondary"
                        onClick={() => window.print()}
                        title="Imprimir dashboard"
                    >
                        🖨️ Imprimir
                    </button>
                </div>
            </div>

            {/* Contenido del dashboard */}
            <div className={style.dashboardContent}>
                {isLoading && (
                    <div className={style.loadingOverlay}>
                        <div className={style.loadingSpinner}>
                            <div className={style.spinner}></div>
                            <p>Cargando datos del dashboard...</p>
                        </div>
                    </div>
                )}
                <AnimatePresence mode="wait">
                    {renderActiveTab()}
                </AnimatePresence>
            </div>

            {/* Información adicional */}
            <div className={`card ${style.infoCard}`}>
                <h3>💡 Información del Dashboard</h3>
                <div className={style.infoGrid}>
                    <div className={style.infoItem}>
                        <strong>Última actualización:</strong> {dashboardData?.metadatos?.fecha_generacion ? new Date(dashboardData.metadatos.fecha_generacion).toLocaleString() : 'No disponible'}
                    </div>
                    <div className={style.infoItem}>
                        <strong>Período analizado:</strong> {filtros.periodo_predefinido || 'Últimos 30 días'}
                    </div>
                    <div className={style.infoItem}>
                        <strong>Agrupación temporal:</strong> {filtros.tipo_periodo || 'Diario'}
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default MantenimientoPage;
