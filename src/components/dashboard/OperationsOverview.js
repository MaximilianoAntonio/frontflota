import { useState, useEffect } from 'preact/hooks';
import { API_BASE_URL } from '../../config';
import { authenticatedFetch, isAuthenticated } from '../../services/authService';
import MetricCard from './MetricCard';
import AlertPanel from './AlertPanel';
import QuickChart from './QuickChart';
import './OperationsOverview.css';

const OperationsOverview = ({ timeFilter, isLoading }) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        // Verificar autenticación antes de cargar datos
        if (!isAuthenticated()) {
            setError('Usuario no autenticado');
            setLoading(false);
            return;
        }
        
        fetchOperationsData();
        
        // Escuchar el evento de actualización del dashboard
        const handleDashboardRefresh = () => fetchOperationsData();
        window.addEventListener('dashboardRefresh', handleDashboardRefresh);
        
        return () => {
            window.removeEventListener('dashboardRefresh', handleDashboardRefresh);
        };
    }, [timeFilter]);

    const fetchOperationsData = async () => {
        setLoading(true);
        setError(null);
        
        try {
            const params = new URLSearchParams({
                tipo_periodo: timeFilter.period,
                ...(timeFilter.startDate && { fecha_inicio: timeFilter.startDate }),
                ...(timeFilter.endDate && { fecha_fin: timeFilter.endDate })
            });

            const response = await authenticatedFetch(`${API_BASE_URL}/dashboard/stats/?${params}`);
            
            if (!response.ok) {
                if (response.status === 401) {
                    throw new Error('Sesión expirada. Por favor, inicia sesión nuevamente.');
                }
                throw new Error(`Error al cargar datos de operaciones: ${response.status}`);
            }
            
            const result = await response.json();
            setData(result);
        } catch (err) {
            console.error('Error fetching operations data:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (loading || isLoading) {
        return (
            <div className="operations-overview">
                <div className="loading-state">
                    <div className="spinner"></div>
                    <p>Cargando vista general de operaciones...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="operations-overview">
                <div className="error-state">
                    <h3>❌ Error al cargar datos</h3>
                    <p>{error}</p>
                    <button onClick={fetchOperationsData} className="retry-btn">
                        Reintentar
                    </button>
                </div>
            </div>
        );
    }

    if (!data) {
        return (
            <div className="operations-overview">
                <div className="no-data-state">
                    <h3>📊 Sin datos disponibles</h3>
                    <p>No hay información disponible para el período seleccionado.</p>
                </div>
            </div>
        );
    }

    const { general, vehiculos, conductores, tendencias } = data;

    return (
        <div className="operations-overview">
            {/* Métricas Principales */}
            <div className="metrics-grid">
                <MetricCard
                    title="Total de Asignaciones"
                    value={general.total_asignaciones}
                    change={tendencias?.asignaciones_cambio}
                    icon="📋"
                    color="#667eea"
                />
                <MetricCard
                    title="Asignaciones Completadas"
                    value={general.asignaciones_completadas}
                    percentage={general.tasa_completitud}
                    icon="✅"
                    color="#38a169"
                />
                <MetricCard
                    title="Distancia Total"
                    value={`${general.distancia_total_km} km`}
                    change={tendencias?.distancia_cambio}
                    icon="🛣️"
                    color="#3182ce"
                />
                <MetricCard
                    title="Vehículos Activos"
                    value={general.vehiculos_utilizados}
                    subtitle={`${general.vehiculos_disponibles} disponibles`}
                    icon="🚗"
                    color="#805ad5"
                />
                <MetricCard
                    title="Conductores Activos"
                    value={general.conductores_utilizados}
                    subtitle={`${general.conductores_disponibles} disponibles`}
                    icon="👨‍💼"
                    color="#d69e2e"
                />
                <MetricCard
                    title="En Mantenimiento"
                    value={general.vehiculos_en_mantenimiento}
                    subtitle="vehículos"
                    icon="🔧"
                    color="#e53e3e"
                    warning={general.vehiculos_en_mantenimiento > 0}
                />
            </div>

            {/* Alertas y Notificaciones */}
            <AlertPanel 
                vehiculosMantenimiento={vehiculos.vehiculos_necesitan_mantenimiento}
                conductoresStatus={conductores.analisis_horarios}
                general={general}
            />

            {/* Gráficos Rápidos */}
            <div className="charts-section">
                <div className="chart-row">
                    <div className="chart-container">
                        <h3>Estado de la Flota</h3>
                        <QuickChart
                            type="doughnut"
                            data={vehiculos.estado_flota}
                            labelField="estado"
                            valueField="count"
                            colors={['#38a169', '#3182ce', '#e53e3e', '#d69e2e']}
                        />
                    </div>
                    
                    <div className="chart-container">
                        <h3>Estados de Conductores</h3>
                        <QuickChart
                            type="doughnut"
                            data={conductores.estado_conductores}
                            labelField="estado_disponibilidad"
                            valueField="count"
                            colors={['#38a169', '#3182ce', '#d69e2e', '#e53e3e']}
                        />
                    </div>
                </div>

                <div className="chart-row">
                    <div className="chart-container full-width">
                        <h3>Uso por Tipo de Vehículo</h3>
                        <QuickChart
                            type="bar"
                            data={vehiculos.distribucion_tipo}
                            labelField="vehiculo__tipo_vehiculo"
                            valueField="count"
                            colors={['#667eea', '#764ba2', '#f093fb', '#f5576c']}
                            horizontal={true}
                        />
                    </div>
                </div>
            </div>

            {/* Resumen de Eficiencia */}
            <div className="efficiency-summary">
                <h3>📈 Resumen de Eficiencia</h3>
                <div className="efficiency-metrics">
                    <div className="efficiency-item">
                        <span className="efficiency-label">Tasa de Completitud:</span>
                        <div className="efficiency-bar">
                            <div 
                                className="efficiency-fill"
                                style={{ 
                                    width: `${general.tasa_completitud}%`,
                                    backgroundColor: general.tasa_completitud >= 80 ? '#38a169' : 
                                                   general.tasa_completitud >= 60 ? '#d69e2e' : '#e53e3e'
                                }}
                            ></div>
                            <span className="efficiency-value">{general.tasa_completitud}%</span>
                        </div>
                    </div>

                    <div className="efficiency-item">
                        <span className="efficiency-label">Utilización de Flota:</span>
                        <div className="efficiency-bar">
                            <div 
                                className="efficiency-fill"
                                style={{ 
                                    width: `${(general.vehiculos_utilizados / (general.vehiculos_utilizados + general.vehiculos_disponibles)) * 100}%`,
                                    backgroundColor: '#3182ce'
                                }}
                            ></div>
                            <span className="efficiency-value">
                                {Math.round((general.vehiculos_utilizados / (general.vehiculos_utilizados + general.vehiculos_disponibles)) * 100)}%
                            </span>
                        </div>
                    </div>

                    <div className="efficiency-item">
                        <span className="efficiency-label">Conductores Activos:</span>
                        <div className="efficiency-bar">
                            <div 
                                className="efficiency-fill"
                                style={{ 
                                    width: `${(general.conductores_en_ruta / (general.conductores_en_ruta + general.conductores_disponibles)) * 100}%`,
                                    backgroundColor: '#805ad5'
                                }}
                            ></div>
                            <span className="efficiency-value">
                                {Math.round((general.conductores_en_ruta / (general.conductores_en_ruta + general.conductores_disponibles)) * 100)}%
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Información de Última Actualización */}
            <div className="update-info">
                <small>
                    📅 Datos generados: {new Date(data.metadatos.fecha_generacion).toLocaleString()}
                    {data.metadatos.filtros_aplicados && (
                        <span> | Filtros: {JSON.stringify(data.metadatos.filtros_aplicados)}</span>
                    )}
                </small>
            </div>
        </div>
    );
};

export default OperationsOverview;
