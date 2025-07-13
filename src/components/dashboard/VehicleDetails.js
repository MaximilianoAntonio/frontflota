import { useState, useEffect } from 'preact/hooks';
import { API_BASE_URL } from '../../config';
import './VehicleDetails.css';

const VehicleDetails = ({ timeFilter, isLoading }) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedVehicle, setSelectedVehicle] = useState(null);
    const [filters, setFilters] = useState({
        search: '',
        estado: '',
        tipo: '',
        mantenimiento: ''
    });

    useEffect(() => {
        fetchVehicleData();
        
        const handleDashboardRefresh = () => fetchVehicleData();
        window.addEventListener('dashboardRefresh', handleDashboardRefresh);
        
        return () => {
            window.removeEventListener('dashboardRefresh', handleDashboardRefresh);
        };
    }, [timeFilter]);

    const fetchVehicleData = async () => {
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
                throw new Error('Error al cargar datos de vehículos');
            }
            
            const result = await response.json();
            setData(result.vehiculos);
        } catch (err) {
            console.error('Error fetching vehicle data:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const getMaintenanceStatus = (vehiculo) => {
        const km = vehiculo.kilometraje || 0;
        const mantenimientoKm = 10000; // Cada 10,000 km
        const kmRestantes = mantenimientoKm - (km % mantenimientoKm);
        const porcentaje = ((km % mantenimientoKm) / mantenimientoKm) * 100;
        
        let estado = 'ok';
        let prioridad = 0;
        
        if (porcentaje >= 95) {
            estado = 'critico';
            prioridad = 100;
        } else if (porcentaje >= 85) {
            estado = 'urgente';
            prioridad = 80;
        } else if (porcentaje >= 70) {
            estado = 'proximo';
            prioridad = 60;
        } else if (porcentaje >= 50) {
            estado = 'menor_urgente';
            prioridad = 40;
        }
        
        return {
            estado,
            prioridad,
            porcentaje: Math.round(porcentaje),
            km_restantes: kmRestantes,
            proximo_mantenimiento_km: Math.ceil(km / mantenimientoKm) * mantenimientoKm
        };
    };

    const getStatusColor = (estado) => {
        switch (estado) {
            case 'critico': return '#e53e3e';
            case 'urgente': return '#d69e2e';
            case 'proximo': return '#3182ce';
            case 'menor_urgente': return '#805ad5';
            default: return '#38a169';
        }
    };

    const getStatusLabel = (estado) => {
        switch (estado) {
            case 'critico': return 'CRÍTICO';
            case 'urgente': return 'URGENTE';
            case 'proximo': return 'PRÓXIMO';
            case 'menor_urgente': return 'PLANIFICADO';
            default: return 'OK';
        }
    };

    const filteredVehicles = data?.analisis_mantenimiento?.filter(vehiculo => {
        const searchTerm = filters.search.toLowerCase();
        const matchesSearch = !searchTerm || 
            vehiculo.patente.toLowerCase().includes(searchTerm) ||
            vehiculo.marca.toLowerCase().includes(searchTerm) ||
            vehiculo.modelo.toLowerCase().includes(searchTerm);
        
        const matchesEstado = !filters.estado || vehiculo.estado === filters.estado;
        const matchesTipo = !filters.tipo || vehiculo.tipo_vehiculo === filters.tipo;
        const matchesMantenimiento = !filters.mantenimiento || 
            vehiculo.mantenimiento?.estado === filters.mantenimiento;
        
        return matchesSearch && matchesEstado && matchesTipo && matchesMantenimiento;
    }) || [];

    if (loading || isLoading) {
        return (
            <div className="vehicle-details">
                <div className="loading-state">
                    <div className="spinner"></div>
                    <p>Cargando detalles de vehículos...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="vehicle-details">
                <div className="error-state">
                    <h3>❌ Error al cargar datos</h3>
                    <p>{error}</p>
                    <button onClick={fetchVehicleData} className="retry-btn">
                        Reintentar
                    </button>
                </div>
            </div>
        );
    }

    if (!data) {
        return (
            <div className="vehicle-details">
                <div className="no-data-state">
                    <h3>🚗 Sin datos de vehículos</h3>
                    <p>No hay información disponible para el período seleccionado.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="vehicle-details">
            {/* Resumen de Mantenimiento */}
            <div className="maintenance-summary">
                <h3>🔧 Estado General de Mantenimiento</h3>
                <div className="summary-grid">
                    <div className="summary-card critical">
                        <span className="summary-count">{data.estadisticas_mantenimiento?.criticos || 0}</span>
                        <span className="summary-label">Críticos</span>
                    </div>
                    <div className="summary-card urgent">
                        <span className="summary-count">{data.estadisticas_mantenimiento?.urgentes || 0}</span>
                        <span className="summary-label">Urgentes</span>
                    </div>
                    <div className="summary-card upcoming">
                        <span className="summary-count">{data.estadisticas_mantenimiento?.proximos || 0}</span>
                        <span className="summary-label">Próximos</span>
                    </div>
                    <div className="summary-card planned">
                        <span className="summary-count">{data.estadisticas_mantenimiento?.menor_urgente || 0}</span>
                        <span className="summary-label">Planificados</span>
                    </div>
                    <div className="summary-card ok">
                        <span className="summary-count">{data.estadisticas_mantenimiento?.ok || 0}</span>
                        <span className="summary-label">OK</span>
                    </div>
                </div>
            </div>

            {/* Filtros */}
            <div className="filters-section">
                <div className="filters-grid">
                    <input
                        type="text"
                        placeholder="Buscar por patente, marca o modelo..."
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
                        <option value="en_uso">En Uso</option>
                        <option value="mantenimiento">Mantenimiento</option>
                        <option value="reservado">Reservado</option>
                    </select>
                    <select 
                        value={filters.mantenimiento}
                        onChange={(e) => setFilters(prev => ({ ...prev, mantenimiento: e.target.value }))}
                        className="filter-select"
                    >
                        <option value="">Estado de mantenimiento</option>
                        <option value="critico">Crítico</option>
                        <option value="urgente">Urgente</option>
                        <option value="proximo">Próximo</option>
                        <option value="menor_urgente">Planificado</option>
                        <option value="ok">OK</option>
                    </select>
                </div>
            </div>

            {/* Lista Detallada de Vehículos */}
            <div className="vehicles-grid">
                {filteredVehicles.map(vehiculo => {
                    const mantenimiento = getMaintenanceStatus(vehiculo);
                    return (
                        <div 
                            key={vehiculo.id} 
                            className={`vehicle-card ${mantenimiento.estado}`}
                            onClick={() => setSelectedVehicle(vehiculo)}
                        >
                            <div className="vehicle-header">
                                <h4 className="vehicle-title">
                                    {vehiculo.marca} {vehiculo.modelo}
                                </h4>
                                <span className="vehicle-plate">{vehiculo.patente}</span>
                                <span className={`status-badge ${vehiculo.estado}`}>
                                    {vehiculo.estado}
                                </span>
                            </div>

                            <div className="vehicle-info">
                                <div className="info-row">
                                    <span className="info-label">Año:</span>
                                    <span className="info-value">{vehiculo.anio || 'N/A'}</span>
                                </div>
                                <div className="info-row">
                                    <span className="info-label">Tipo:</span>
                                    <span className="info-value">{vehiculo.tipo_vehiculo}</span>
                                </div>
                                <div className="info-row">
                                    <span className="info-label">Capacidad:</span>
                                    <span className="info-value">{vehiculo.capacidad_pasajeros} pasajeros</span>
                                </div>
                            </div>

                            <div className="maintenance-info">
                                <div className="maintenance-header">
                                    <span className="maintenance-label">Estado de Mantenimiento:</span>
                                    <span 
                                        className="maintenance-status"
                                        style={{ color: getStatusColor(mantenimiento.estado) }}
                                    >
                                        {getStatusLabel(mantenimiento.estado)}
                                    </span>
                                </div>
                                
                                <div className="km-info">
                                    <div className="km-row">
                                        <span>Kilometraje actual: <strong>{vehiculo.kilometraje.toLocaleString()} km</strong></span>
                                    </div>
                                    <div className="km-row">
                                        <span>Próximo mantenimiento: <strong>{mantenimiento.proximo_mantenimiento_km.toLocaleString()} km</strong></span>
                                    </div>
                                    <div className="km-row">
                                        <span>Kilómetros restantes: <strong>{mantenimiento.km_restantes.toLocaleString()} km</strong></span>
                                    </div>
                                </div>

                                <div className="progress-section">
                                    <div className="progress-label">
                                        Progreso hacia mantenimiento: {mantenimiento.porcentaje}%
                                    </div>
                                    <div className="progress-bar">
                                        <div 
                                            className="progress-fill"
                                            style={{ 
                                                width: `${mantenimiento.porcentaje}%`,
                                                backgroundColor: getStatusColor(mantenimiento.estado)
                                            }}
                                        ></div>
                                    </div>
                                </div>
                            </div>

                            {data.uso_por_vehiculo && (
                                <div className="usage-info">
                                    {(() => {
                                        const uso = data.uso_por_vehiculo.find(v => v.vehiculo__id === vehiculo.id);
                                        return uso ? (
                                            <div className="usage-stats">
                                                <div className="usage-item">
                                                    <span className="usage-label">Viajes:</span>
                                                    <span className="usage-value">{uso.total_viajes}</span>
                                                </div>
                                                <div className="usage-item">
                                                    <span className="usage-label">Distancia:</span>
                                                    <span className="usage-value">{uso.distancia_total?.toFixed(1) || 0} km</span>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="no-usage">Sin actividad en el período</div>
                                        );
                                    })()}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {filteredVehicles.length === 0 && (
                <div className="no-results">
                    <p>🔍 No se encontraron vehículos que coincidan con los filtros aplicados.</p>
                </div>
            )}

            {/* Modal de Detalles (opcional) */}
            {selectedVehicle && (
                <div className="vehicle-modal-overlay" onClick={() => setSelectedVehicle(null)}>
                    <div className="vehicle-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>{selectedVehicle.marca} {selectedVehicle.modelo}</h3>
                            <button 
                                className="close-btn"
                                onClick={() => setSelectedVehicle(null)}
                            >
                                ✕
                            </button>
                        </div>
                        <div className="modal-content">
                            {/* Aquí puedes agregar más detalles del vehículo */}
                            <p>Detalles completos del vehículo {selectedVehicle.patente}</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default VehicleDetails;
