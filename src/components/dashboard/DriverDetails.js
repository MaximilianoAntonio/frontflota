import { useState, useEffect } from 'preact/hooks';
import { API_BASE_URL } from '../../config';
import './DriverDetails.css';

const DriverDetails = ({ timeFilter, isLoading }) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filters, setFilters] = useState({
        search: '',
        estado: '',
        rendimiento: ''
    });

    useEffect(() => {
        fetchDriverData();
        
        const handleDashboardRefresh = () => fetchDriverData();
        window.addEventListener('dashboardRefresh', handleDashboardRefresh);
        
        return () => {
            window.removeEventListener('dashboardRefresh', handleDashboardRefresh);
        };
    }, [timeFilter]);

    const fetchDriverData = async () => {
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
                throw new Error('Error al cargar datos de conductores');
            }
            
            const result = await response.json();
            setData(result.conductores);
        } catch (err) {
            console.error('Error fetching driver data:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const getEfficiencyColor = (eficiencia) => {
        if (eficiencia >= 80) return '#38a169';
        if (eficiencia >= 60) return '#d69e2e';
        return '#e53e3e';
    };

    const getWorkStatusLabel = (estado) => {
        switch (estado) {
            case 'completo': return 'Tiempo Completo';
            case 'regular': return 'Regular';
            case 'bajo': return 'Bajo';
            case 'inactivo': return 'Inactivo';
            default: return 'N/A';
        }
    };

    const filteredDrivers = data?.analisis_horarios?.filter(conductor => {
        const searchTerm = filters.search.toLowerCase();
        const matchesSearch = !searchTerm || 
            conductor.nombre.toLowerCase().includes(searchTerm) ||
            conductor.apellido.toLowerCase().includes(searchTerm) ||
            conductor.numero_licencia.toLowerCase().includes(searchTerm);
        
        const matchesEstado = !filters.estado || conductor.estado_disponibilidad === filters.estado;
        const matchesRendimiento = !filters.rendimiento || 
            conductor.horarios?.estado_trabajo === filters.rendimiento;
        
        return matchesSearch && matchesEstado && matchesRendimiento;
    }) || [];

    if (loading || isLoading) {
        return (
            <div className="driver-details">
                <div className="loading-state">
                    <div className="spinner"></div>
                    <p>Cargando detalles de conductores...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="driver-details">
                <div className="error-state">
                    <h3>❌ Error al cargar datos</h3>
                    <p>{error}</p>
                    <button onClick={fetchDriverData} className="retry-btn">
                        Reintentar
                    </button>
                </div>
            </div>
        );
    }

    if (!data) {
        return (
            <div className="driver-details">
                <div className="no-data-state">
                    <h3>👨‍💼 Sin datos de conductores</h3>
                    <p>No hay información disponible para el período seleccionado.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="driver-details">
            {/* Resumen de Rendimiento */}
            <div className="performance-summary">
                <h3>📊 Resumen de Rendimiento de Conductores</h3>
                <div className="summary-grid">
                    <div className="summary-card active">
                        <span className="summary-count">{data.estadisticas_horarios?.activos || 0}</span>
                        <span className="summary-label">Activos</span>
                    </div>
                    <div className="summary-card complete">
                        <span className="summary-count">{data.estadisticas_horarios?.completos || 0}</span>
                        <span className="summary-label">Tiempo Completo</span>
                    </div>
                    <div className="summary-card regular">
                        <span className="summary-count">{data.estadisticas_horarios?.regulares || 0}</span>
                        <span className="summary-label">Regular</span>
                    </div>
                    <div className="summary-card low">
                        <span className="summary-count">{data.estadisticas_horarios?.bajos || 0}</span>
                        <span className="summary-label">Bajo</span>
                    </div>
                    <div className="summary-card inactive">
                        <span className="summary-count">{data.estadisticas_horarios?.inactivos || 0}</span>
                        <span className="summary-label">Inactivos</span>
                    </div>
                </div>
                
                <div className="fleet-metrics">
                    <div className="metric-item">
                        <span className="metric-label">Promedio de Horas por Conductor:</span>
                        <span className="metric-value">{data.estadisticas_horarios?.horas_promedio_flota || 0} hrs/día</span>
                    </div>
                    <div className="metric-item">
                        <span className="metric-label">Eficiencia Promedio de la Flota:</span>
                        <span 
                            className="metric-value"
                            style={{ color: getEfficiencyColor(data.estadisticas_horarios?.eficiencia_promedio || 0) }}
                        >
                            {data.estadisticas_horarios?.eficiencia_promedio || 0}%
                        </span>
                    </div>
                </div>
            </div>

            {/* Filtros */}
            <div className="filters-section">
                <div className="filters-grid">
                    <input
                        type="text"
                        placeholder="Buscar por nombre, apellido o licencia..."
                        value={filters.search}
                        onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                        className="search-input"
                    />
                    <select 
                        value={filters.estado}
                        onChange={(e) => setFilters(prev => ({ ...prev, estado: e.target.value }))}
                        className="filter-select"
                    >
                        <option value="">Todos los estados</option>
                        <option value="disponible">Disponible</option>
                        <option value="en_ruta">En Ruta</option>
                        <option value="dia_libre">Día Libre</option>
                        <option value="no_disponible">No Disponible</option>
                    </select>
                    <select 
                        value={filters.rendimiento}
                        onChange={(e) => setFilters(prev => ({ ...prev, rendimiento: e.target.value }))}
                        className="filter-select"
                    >
                        <option value="">Todos los rendimientos</option>
                        <option value="completo">Tiempo Completo</option>
                        <option value="regular">Regular</option>
                        <option value="bajo">Bajo</option>
                        <option value="inactivo">Inactivo</option>
                    </select>
                </div>
            </div>

            {/* Lista Detallada de Conductores */}
            <div className="drivers-grid">
                {filteredDrivers.map(conductor => (
                    <div 
                        key={conductor.id} 
                        className={`driver-card ${conductor.horarios?.estado_trabajo || 'unknown'}`}
                    >
                        <div className="driver-header">
                            <div className="driver-info">
                                <h4 className="driver-name">
                                    {conductor.nombre} {conductor.apellido}
                                </h4>
                                <span className="driver-license">Lic: {conductor.numero_licencia}</span>
                            </div>
                            <span className={`status-badge ${conductor.estado_disponibilidad}`}>
                                {conductor.estado_disponibilidad}
                            </span>
                        </div>

                        {/* Análisis de Horarios */}
                        <div className="schedule-analysis">
                            <h5>📅 Análisis de Horarios (Últimos 30 días)</h5>
                            
                            <div className="schedule-metrics">
                                <div className="schedule-item">
                                    <span className="schedule-label">Días Trabajados:</span>
                                    <span className="schedule-value">{conductor.horarios?.dias_trabajados || 0}</span>
                                </div>
                                <div className="schedule-item">
                                    <span className="schedule-label">Horas Promedio/Día:</span>
                                    <span className="schedule-value">{conductor.horarios?.horas_promedio_dia || 0} hrs</span>
                                </div>
                                <div className="schedule-item">
                                    <span className="schedule-label">Total de Horas:</span>
                                    <span className="schedule-value">{conductor.horarios?.total_horas || 0} hrs</span>
                                </div>
                                <div className="schedule-item">
                                    <span className="schedule-label">Estado de Trabajo:</span>
                                    <span 
                                        className="schedule-status"
                                        style={{ 
                                            color: conductor.horarios?.estado_trabajo === 'completo' ? '#38a169' :
                                                   conductor.horarios?.estado_trabajo === 'regular' ? '#3182ce' :
                                                   conductor.horarios?.estado_trabajo === 'bajo' ? '#d69e2e' : '#e53e3e'
                                        }}
                                    >
                                        {getWorkStatusLabel(conductor.horarios?.estado_trabajo)}
                                    </span>
                                </div>
                            </div>

                            {/* Barra de Progreso de Actividad */}
                            <div className="activity-progress">
                                <div className="progress-label">
                                    Actividad: {conductor.horarios?.porcentaje_actividad || 0}%
                                </div>
                                <div className="progress-bar">
                                    <div 
                                        className="progress-fill"
                                        style={{ 
                                            width: `${conductor.horarios?.porcentaje_actividad || 0}%`,
                                            backgroundColor: getEfficiencyColor(conductor.horarios?.porcentaje_actividad || 0)
                                        }}
                                    ></div>
                                </div>
                            </div>
                        </div>

                        {/* Rendimiento en Viajes */}
                        <div className="performance-section">
                            <h5>🚗 Rendimiento en Viajes</h5>
                            
                            <div className="performance-metrics">
                                <div className="performance-item">
                                    <span className="performance-label">Total de Viajes:</span>
                                    <span className="performance-value">{conductor.viajes?.total_viajes || 0}</span>
                                </div>
                                <div className="performance-item">
                                    <span className="performance-label">Viajes Completados:</span>
                                    <span className="performance-value">{conductor.viajes?.viajes_completados || 0}</span>
                                </div>
                                <div className="performance-item">
                                    <span className="performance-label">Tasa de Éxito:</span>
                                    <span className="performance-value">{conductor.viajes?.tasa_completitud || 0}%</span>
                                </div>
                                <div className="performance-item">
                                    <span className="performance-label">Distancia Total:</span>
                                    <span className="performance-value">{conductor.viajes?.distancia_total?.toFixed(1) || 0} km</span>
                                </div>
                            </div>

                            {/* Eficiencia General */}
                            <div className="efficiency-section">
                                <div className="efficiency-label">
                                    Eficiencia General: {conductor.eficiencia_general || 0}%
                                </div>
                                <div className="efficiency-bar">
                                    <div 
                                        className="efficiency-fill"
                                        style={{ 
                                            width: `${conductor.eficiencia_general || 0}%`,
                                            backgroundColor: getEfficiencyColor(conductor.eficiencia_general || 0)
                                        }}
                                    ></div>
                                </div>
                            </div>
                        </div>

                        {/* Calendario Visual Simple */}
                        <div className="calendar-section">
                            <h5>📆 Actividad Reciente</h5>
                            <div className="calendar-grid">
                                {/* Aquí puedes agregar un calendario simple mostrando días trabajados */}
                                {Array.from({ length: 30 }, (_, i) => (
                                    <div 
                                        key={i}
                                        className={`calendar-day ${Math.random() > 0.7 ? 'worked' : 'off'}`}
                                        title={`Día ${30 - i}`}
                                    ></div>
                                ))}
                            </div>
                            <div className="calendar-legend">
                                <span className="legend-item">
                                    <div className="legend-color worked"></div>
                                    Trabajado
                                </span>
                                <span className="legend-item">
                                    <div className="legend-color off"></div>
                                    Libre
                                </span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {filteredDrivers.length === 0 && (
                <div className="no-results">
                    <p>🔍 No se encontraron conductores que coincidan con los filtros aplicados.</p>
                </div>
            )}
        </div>
    );
};

export default DriverDetails;
