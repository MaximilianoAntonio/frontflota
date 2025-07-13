import { useState, useEffect } from 'preact/hooks';
import { API_BASE_URL } from '../../config';
import './AssignmentMap.css';

const AssignmentMap = ({ timeFilter, isLoading }) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedFilter, setSelectedFilter] = useState('all');

    useEffect(() => {
        fetchMapData();
        
        const handleDashboardRefresh = () => fetchMapData();
        window.addEventListener('dashboardRefresh', handleDashboardRefresh);
        
        return () => {
            window.removeEventListener('dashboardRefresh', handleDashboardRefresh);
        };
    }, [timeFilter]);

    const fetchMapData = async () => {
        setLoading(true);
        setError(null);
        
        try {
            const params = new URLSearchParams({
                tipo_periodo: timeFilter.period,
                ...(timeFilter.startDate && { fecha_inicio: timeFilter.startDate }),
                ...(timeFilter.endDate && { fecha_fin: timeFilter.endDate })
            });

            const response = await fetch(`${API_BASE_URL}/dashboard/stats/?${params}`);
            
            if (!response.ok) {
                throw new Error('Error al cargar datos del mapa');
            }
            
            const result = await response.json();
            setData(result.mapa);
        } catch (err) {
            console.error('Error fetching map data:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (loading || isLoading) {
        return (
            <div className="assignment-map">
                <div className="loading-state">
                    <div className="spinner"></div>
                    <p>Cargando mapa de asignaciones...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="assignment-map">
                <div className="error-state">
                    <h3>❌ Error al cargar datos del mapa</h3>
                    <p>{error}</p>
                    <button onClick={fetchMapData} className="retry-btn">
                        Reintentar
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="assignment-map">
            {/* Header con Filtros */}
            <div className="map-header">
                <h3>🗺️ Mapa de Asignaciones y Recorridos</h3>
                <div className="map-filters">
                    <select 
                        value={selectedFilter}
                        onChange={(e) => setSelectedFilter(e.target.value)}
                        className="filter-select"
                    >
                        <option value="all">Todas las asignaciones</option>
                        <option value="completed">Completadas</option>
                        <option value="active">Activas</option>
                        <option value="pending">Pendientes</option>
                    </select>
                </div>
            </div>

            {/* Contenedor del Mapa */}
            <div className="map-container">
                <div className="map-placeholder">
                    <div className="map-placeholder-content">
                        <h4>🚧 Mapa en Desarrollo</h4>
                        <p>Esta funcionalidad está siendo implementada</p>
                        <div className="map-features">
                            <h5>Características planeadas:</h5>
                            <ul>
                                <li>📍 Puntos de origen y destino de asignaciones</li>
                                <li>🛣️ Rutas tomadas por los vehículos</li>
                                <li>🔥 Heatmap de zonas de alta actividad</li>
                                <li>🚗 Ubicación actual de vehículos (GPS)</li>
                                <li>📊 Filtros por conductor, vehículo y fecha</li>
                                <li>📱 Vista interactiva con zoom y navegación</li>
                            </ul>
                        </div>
                        
                        <div className="temp-stats">
                            <h5>📊 Estadísticas Temporales:</h5>
                            <div className="stats-grid">
                                <div className="stat-item">
                                    <span className="stat-label">Total de Rutas:</span>
                                    <span className="stat-value">{data?.total_rutas || 'N/A'}</span>
                                </div>
                                <div className="stat-item">
                                    <span className="stat-label">Distancia Total:</span>
                                    <span className="stat-value">{data?.distancia_total || 'N/A'} km</span>
                                </div>
                                <div className="stat-item">
                                    <span className="stat-label">Zonas Activas:</span>
                                    <span className="stat-value">{data?.zonas_activas || 'N/A'}</span>
                                </div>
                                <div className="stat-item">
                                    <span className="stat-label">Vehículos en Ruta:</span>
                                    <span className="stat-value">{data?.vehiculos_en_ruta || 'N/A'}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Leyenda y Controles */}
            <div className="map-legend">
                <h4>Leyenda:</h4>
                <div className="legend-items">
                    <div className="legend-item">
                        <div className="legend-color origin"></div>
                        <span>Puntos de Origen</span>
                    </div>
                    <div className="legend-item">
                        <div className="legend-color destination"></div>
                        <span>Puntos de Destino</span>
                    </div>
                    <div className="legend-item">
                        <div className="legend-color route"></div>
                        <span>Rutas Completadas</span>
                    </div>
                    <div className="legend-item">
                        <div className="legend-color active"></div>
                        <span>Vehículos Activos</span>
                    </div>
                </div>
            </div>

            {/* Panel de Información */}
            <div className="map-info-panel">
                <h4>📊 Información del Período</h4>
                <div className="info-content">
                    <p>Para el período seleccionado ({timeFilter.period}):</p>
                    <div className="info-stats">
                        <div className="info-stat">
                            <strong>Asignaciones Mapeadas:</strong>
                            <span>{data?.asignaciones_con_coordenadas || 0}</span>
                        </div>
                        <div className="info-stat">
                            <strong>Cobertura Geográfica:</strong>
                            <span>{data?.cobertura_geografica || 'Región de Valparaíso'}</span>
                        </div>
                        <div className="info-stat">
                            <strong>Zona más Activa:</strong>
                            <span>{data?.zona_mas_activa || 'Centro de Valparaíso'}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Nota de Desarrollo */}
            <div className="development-note">
                <h4>🔧 Nota de Desarrollo</h4>
                <p>
                    Este mapa será implementado usando <strong>Leaflet</strong> con datos de OpenStreetMap.
                    Se integrará con los datos de latitud y longitud almacenados en las asignaciones
                    para mostrar rutas reales y análisis geográfico detallado.
                </p>
                <div className="tech-details">
                    <h5>Tecnologías a implementar:</h5>
                    <ul>
                        <li>📍 <strong>Leaflet.js</strong> - Mapas interactivos</li>
                        <li>🗺️ <strong>OpenStreetMap</strong> - Datos cartográficos</li>
                        <li>🔥 <strong>Leaflet.heat</strong> - Mapas de calor</li>
                        <li>📍 <strong>Leaflet.markercluster</strong> - Agrupación de marcadores</li>
                        <li>🛣️ <strong>Leaflet.Routing.Machine</strong> - Cálculo de rutas</li>
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default AssignmentMap;
