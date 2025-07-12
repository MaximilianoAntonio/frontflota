import { h } from 'preact';
import { useState, useEffect, useRef } from 'preact/hooks';
import style from './style.css';

const StaticMap = ({ assignments = [] }) => {
    const [mapType, setMapType] = useState('list');
    const [showInteractiveOption, setShowInteractiveOption] = useState(true);
    const [interactiveMap, setInteractiveMap] = useState(null);
    const [isLoadingInteractive, setIsLoadingInteractive] = useState(false);
    const mapRef = useRef(null);

    // Función para intentar cargar el mapa interactivo
    const loadInteractiveMap = async () => {
        setIsLoadingInteractive(true);
        try {
            // Cargar CSS de Leaflet
            if (!document.querySelector('link[href*="leaflet"]')) {
                const cssLink = document.createElement('link');
                cssLink.rel = 'stylesheet';
                cssLink.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
                document.head.appendChild(cssLink);
            }

            // Cargar JavaScript de Leaflet
            if (!window.L) {
                await new Promise((resolve, reject) => {
                    const script = document.createElement('script');
                    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
                    script.onload = resolve;
                    script.onerror = reject;
                    document.head.appendChild(script);
                });
            }

            // Crear mapa
            if (mapRef.current && window.L) {
                const map = window.L.map(mapRef.current, {
                    center: [-33.4489, -70.6693],
                    zoom: 10
                });

                window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    attribution: '© OpenStreetMap contributors'
                }).addTo(map);

                // Agregar marcadores
                addMarkersToMap(map);
                setInteractiveMap(map);
                setMapType('interactive');
            }
        } catch (error) {
            console.warn('Failed to load interactive map:', error);
            setShowInteractiveOption(false);
        } finally {
            setIsLoadingInteractive(false);
        }
    };

    const addMarkersToMap = (map) => {
        if (!map || !window.L || !assignments?.length) return;

        assignments.forEach(assignment => {
            const extractCoords = (location) => {
                if (!location) return null;
                const regex = /(-?\d+\.?\d*),\s*(-?\d+\.?\d*)/;
                const match = location.match(regex);
                return match ? [parseFloat(match[1]), parseFloat(match[2])] : null;
            };

            const originCoords = extractCoords(assignment.origen);
            const destCoords = extractCoords(assignment.destino);

            if (originCoords) {
                window.L.marker(originCoords)
                    .addTo(map)
                    .bindPopup(`
                        <b>📍 Origen</b><br>
                        Conductor: ${assignment.conductor || 'N/A'}<br>
                        Vehículo: ${assignment.vehiculo || 'N/A'}<br>
                        Ubicación: ${assignment.origen}
                    `);
            }

            if (destCoords) {
                window.L.marker(destCoords)
                    .addTo(map)
                    .bindPopup(`
                        <b>🎯 Destino</b><br>
                        Conductor: ${assignment.conductor || 'N/A'}<br>
                        Vehículo: ${assignment.vehiculo || 'N/A'}<br>
                        Ubicación: ${assignment.destino}
                    `);
            }

            if (originCoords && destCoords) {
                window.L.polyline([originCoords, destCoords], {
                    color: '#2196F3',
                    weight: 3,
                    opacity: 0.7
                }).addTo(map);
            }
        });
    };

    // Función para extraer coordenadas de la ubicación
    const extractCoordinates = (location) => {
        if (!location) return null;
        const regex = /(-?\d+\.?\d*),\s*(-?\d+\.?\d*)/;
        const match = location.match(regex);
        if (match) {
            return {
                lat: parseFloat(match[1]),
                lng: parseFloat(match[2])
            };
        }
        return null;
    };

    // Procesar datos de asignaciones
    const processedAssignments = assignments.map((assignment, index) => {
        const originCoords = extractCoordinates(assignment.origen);
        const destCoords = extractCoordinates(assignment.destino);
        
        return {
            id: index,
            name: assignment.conductor || `Conductor ${index + 1}`,
            vehiculo: assignment.vehiculo || 'Vehículo no asignado',
            origen: assignment.origen,
            destino: assignment.destino,
            originCoords,
            destCoords,
            estado: assignment.estado || 'En ruta',
            fecha: assignment.fecha || new Date().toLocaleDateString()
        };
    });

    const validAssignments = processedAssignments.filter(a => a.originCoords || a.destCoords);

    // Renderizar vista de lista
    const renderListView = () => (
        <div className={style.listView}>
            <div className={style.listHeader}>
                <h4>📍 Asignaciones Activas</h4>
                <span className={style.counter}>{validAssignments.length} asignaciones</span>
            </div>
            <div className={style.assignmentsList}>
                {validAssignments.map((assignment) => (
                    <div key={assignment.id} className={style.assignmentCard}>
                        <div className={style.assignmentHeader}>
                            <div className={style.assignmentTitle}>
                                <span className={style.conductorName}>👤 {assignment.name}</span>
                                <span className={style.vehiculo}>🚗 {assignment.vehiculo}</span>
                            </div>
                            <span className={`${style.estado} ${style[assignment.estado?.toLowerCase()]}`}>
                                {assignment.estado}
                            </span>
                        </div>
                        
                        <div className={style.routeInfo}>
                            <div className={style.location}>
                                <span className={style.locationLabel}>📍 Origen:</span>
                                <span className={style.locationValue}>
                                    {assignment.origen || 'No especificado'}
                                </span>
                                {assignment.originCoords && (
                                    <span className={style.coordinates}>
                                        ({assignment.originCoords.lat.toFixed(4)}, {assignment.originCoords.lng.toFixed(4)})
                                    </span>
                                )}
                            </div>
                            
                            <div className={style.routeArrow}>⬇</div>
                            
                            <div className={style.location}>
                                <span className={style.locationLabel}>🎯 Destino:</span>
                                <span className={style.locationValue}>
                                    {assignment.destino || 'No especificado'}
                                </span>
                                {assignment.destCoords && (
                                    <span className={style.coordinates}>
                                        ({assignment.destCoords.lat.toFixed(4)}, {assignment.destCoords.lng.toFixed(4)})
                                    </span>
                                )}
                            </div>
                        </div>
                        
                        <div className={style.assignmentFooter}>
                            <span className={style.fecha}>📅 {assignment.fecha}</span>
                            <button 
                                className={style.trackButton}
                                onClick={() => {
                                    if (assignment.originCoords) {
                                        window.open(`https://www.google.com/maps?q=${assignment.originCoords.lat},${assignment.originCoords.lng}`, '_blank');
                                    }
                                }}
                            >
                                📍 Ver en Google Maps
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    // Renderizar vista de tabla
    const renderTableView = () => (
        <div className={style.tableView}>
            <table className={style.assignmentsTable}>
                <thead>
                    <tr>
                        <th>👤 Conductor</th>
                        <th>🚗 Vehículo</th>
                        <th>📍 Origen</th>
                        <th>🎯 Destino</th>
                        <th>📊 Estado</th>
                        <th>📅 Fecha</th>
                        <th>🔗 Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    {validAssignments.map((assignment) => (
                        <tr key={assignment.id}>
                            <td>{assignment.name}</td>
                            <td>{assignment.vehiculo}</td>
                            <td>
                                <div className={style.locationCell}>
                                    {assignment.origen}
                                    {assignment.originCoords && (
                                        <small className={style.coordinates}>
                                            ({assignment.originCoords.lat.toFixed(3)}, {assignment.originCoords.lng.toFixed(3)})
                                        </small>
                                    )}
                                </div>
                            </td>
                            <td>
                                <div className={style.locationCell}>
                                    {assignment.destino}
                                    {assignment.destCoords && (
                                        <small className={style.coordinates}>
                                            ({assignment.destCoords.lat.toFixed(3)}, {assignment.destCoords.lng.toFixed(3)})
                                        </small>
                                    )}
                                </div>
                            </td>
                            <td>
                                <span className={`${style.estado} ${style[assignment.estado?.toLowerCase()]}`}>
                                    {assignment.estado}
                                </span>
                            </td>
                            <td>{assignment.fecha}</td>
                            <td>
                                <button 
                                    className={style.smallButton}
                                    onClick={() => {
                                        if (assignment.originCoords) {
                                            window.open(`https://www.google.com/maps?q=${assignment.originCoords.lat},${assignment.originCoords.lng}`, '_blank');
                                        }
                                    }}
                                >
                                    🗺️
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );

    // Renderizar estadísticas
    const renderStats = () => {
        const stats = {
            total: validAssignments.length,
            enRuta: validAssignments.filter(a => a.estado?.toLowerCase().includes('ruta')).length,
            completadas: validAssignments.filter(a => a.estado?.toLowerCase().includes('completada')).length,
            pendientes: validAssignments.filter(a => a.estado?.toLowerCase().includes('pendiente')).length
        };

        return (
            <div className={style.statsContainer}>
                <div className={style.statCard}>
                    <span className={style.statNumber}>{stats.total}</span>
                    <span className={style.statLabel}>Total</span>
                </div>
                <div className={style.statCard}>
                    <span className={style.statNumber}>{stats.enRuta}</span>
                    <span className={style.statLabel}>En Ruta</span>
                </div>
                <div className={style.statCard}>
                    <span className={style.statNumber}>{stats.completadas}</span>
                    <span className={style.statLabel}>Completadas</span>
                </div>
                <div className={style.statCard}>
                    <span className={style.statNumber}>{stats.pendientes}</span>
                    <span className={style.statLabel}>Pendientes</span>
                </div>
            </div>
        );
    };

    if (!assignments || assignments.length === 0) {
        return (
            <div className={style.emptyState}>
                <div className={style.emptyIcon}>🗺️</div>
                <h3>No hay asignaciones disponibles</h3>
                <p>No se encontraron asignaciones con coordenadas para mostrar.</p>
            </div>
        );
    }

    return (
        <div className={style.staticMap}>
            {/* Header con controles */}
            <div className={style.mapHeader}>
                <div className={style.headerLeft}>
                    <h3>📍 Vista de Asignaciones</h3>
                    <p>{validAssignments.length} de {assignments.length} asignaciones con coordenadas</p>
                </div>
                <div className={style.headerRight}>
                    <div className={style.viewToggle}>
                        {showInteractiveOption && (
                            <button 
                                className={`${style.toggleButton} ${mapType === 'interactive' ? style.active : ''}`}
                                onClick={loadInteractiveMap}
                                disabled={isLoadingInteractive}
                            >
                                {isLoadingInteractive ? '⏳' : '🗺️'} Mapa Interactivo
                            </button>
                        )}
                        <button 
                            className={`${style.toggleButton} ${mapType === 'list' ? style.active : ''}`}
                            onClick={() => setMapType('list')}
                        >
                            📋 Lista
                        </button>
                        <button 
                            className={`${style.toggleButton} ${mapType === 'table' ? style.active : ''}`}
                            onClick={() => setMapType('table')}
                        >
                            📊 Tabla
                        </button>
                    </div>
                </div>
            </div>

            {/* Estadísticas */}
            {renderStats()}

            {/* Contenido principal */}
            <div className={style.mapContent}>
                {mapType === 'interactive' ? (
                    <div style={{ height: '500px', width: '100%' }}>
                        <div ref={mapRef} style={{ height: '100%', width: '100%' }} />
                    </div>
                ) : mapType === 'list' ? renderListView() : renderTableView()}
            </div>

            {/* Footer con información */}
            <div className={style.mapFooter}>
                <p>💡 <strong>Tip:</strong> Haz clic en "Ver en Google Maps" para abrir la ubicación en una nueva ventana</p>
                <small>Última actualización: {new Date().toLocaleString()}</small>
            </div>
        </div>
    );
};

export default StaticMap;
