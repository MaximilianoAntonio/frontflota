import { h } from 'preact';
import { useState } from 'preact/hooks';
import style from './style.css';

const SimpleAssignmentView = ({ assignments = [] }) => {
    const [viewMode, setViewMode] = useState('map');
    const [selectedAssignment, setSelectedAssignment] = useState(null);

    // Procesar asignaciones para extraer coordenadas
    const processAssignments = (assignments) => {
        return assignments.map((assignment, index) => {
            const extractCoords = (location) => {
                if (!location) return null;
                const regex = /(-?\d+\.?\d*),\s*(-?\d+\.?\d*)/;
                const match = location.match(regex);
                return match ? {
                    lat: parseFloat(match[1]),
                    lng: parseFloat(match[2])
                } : null;
            };

            return {
                id: index,
                ...assignment,
                originCoords: extractCoords(assignment.origen),
                destCoords: extractCoords(assignment.destino)
            };
        }).filter(a => a.originCoords || a.destCoords);
    };

    const processedAssignments = processAssignments(assignments);

    // Simular posiciones en el mapa (normalizar coordenadas para mostrar en un área rectangular)
    const normalizeCoordinates = (assignments) => {
        if (assignments.length === 0) return [];

        const allCoords = [];
        assignments.forEach(a => {
            if (a.originCoords) allCoords.push(a.originCoords);
            if (a.destCoords) allCoords.push(a.destCoords);
        });

        if (allCoords.length === 0) return assignments;

        const minLat = Math.min(...allCoords.map(c => c.lat));
        const maxLat = Math.max(...allCoords.map(c => c.lat));
        const minLng = Math.min(...allCoords.map(c => c.lng));
        const maxLng = Math.max(...allCoords.map(c => c.lng));

        const latRange = maxLat - minLat || 1;
        const lngRange = maxLng - minLng || 1;

        return assignments.map(a => ({
            ...a,
            originPos: a.originCoords ? {
                x: ((a.originCoords.lng - minLng) / lngRange) * 100,
                y: ((maxLat - a.originCoords.lat) / latRange) * 100
            } : null,
            destPos: a.destCoords ? {
                x: ((a.destCoords.lng - minLng) / lngRange) * 100,
                y: ((maxLat - a.destCoords.lat) / latRange) * 100
            } : null
        }));
    };

    const normalizedAssignments = normalizeCoordinates(processedAssignments);

    const renderSimulatedMap = () => (
        <div className={style.simulatedMap}>
            <div className={style.mapCanvas}>
                {/* Líneas de conexión */}
                {normalizedAssignments.map(assignment => 
                    assignment.originPos && assignment.destPos && (
                        <svg key={`line-${assignment.id}`} className={style.connectionLine}>
                            <line
                                x1={`${assignment.originPos.x}%`}
                                y1={`${assignment.originPos.y}%`}
                                x2={`${assignment.destPos.x}%`}
                                y2={`${assignment.destPos.y}%`}
                                stroke="#2196F3"
                                strokeWidth="2"
                                strokeDasharray="5,5"
                                opacity="0.7"
                            />
                        </svg>
                    )
                )}

                {/* Marcadores de origen */}
                {normalizedAssignments.map(assignment => 
                    assignment.originPos && (
                        <div
                            key={`origin-${assignment.id}`}
                            className={`${style.mapMarker} ${style.originMarker}`}
                            style={{
                                left: `${assignment.originPos.x}%`,
                                top: `${assignment.originPos.y}%`
                            }}
                            onClick={() => setSelectedAssignment(assignment)}
                            title={`Origen: ${assignment.origen}`}
                        >
                            📍
                        </div>
                    )
                )}

                {/* Marcadores de destino */}
                {normalizedAssignments.map(assignment => 
                    assignment.destPos && (
                        <div
                            key={`dest-${assignment.id}`}
                            className={`${style.mapMarker} ${style.destMarker}`}
                            style={{
                                left: `${assignment.destPos.x}%`,
                                top: `${assignment.destPos.y}%`
                            }}
                            onClick={() => setSelectedAssignment(assignment)}
                            title={`Destino: ${assignment.destino}`}
                        >
                            🎯
                        </div>
                    )
                )}
            </div>

            {/* Panel de información del marcador seleccionado */}
            {selectedAssignment && (
                <div className={style.markerInfo}>
                    <div className={style.markerInfoHeader}>
                        <h4>📍 Información de Asignación</h4>
                        <button 
                            className={style.closeInfo}
                            onClick={() => setSelectedAssignment(null)}
                        >
                            ✕
                        </button>
                    </div>
                    <div className={style.markerInfoContent}>
                        <p><strong>Conductor:</strong> {selectedAssignment.conductor || 'No asignado'}</p>
                        <p><strong>Vehículo:</strong> {selectedAssignment.vehiculo || 'No asignado'}</p>
                        <p><strong>Origen:</strong> {selectedAssignment.origen}</p>
                        <p><strong>Destino:</strong> {selectedAssignment.destino}</p>
                        <p><strong>Estado:</strong> {selectedAssignment.estado || 'Sin estado'}</p>
                        {selectedAssignment.originCoords && (
                            <p><strong>Coord. Origen:</strong> {selectedAssignment.originCoords.lat.toFixed(4)}, {selectedAssignment.originCoords.lng.toFixed(4)}</p>
                        )}
                        {selectedAssignment.destCoords && (
                            <p><strong>Coord. Destino:</strong> {selectedAssignment.destCoords.lat.toFixed(4)}, {selectedAssignment.destCoords.lng.toFixed(4)}</p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );

    const renderListView = () => (
        <div className={style.listContainer}>
            {normalizedAssignments.length === 0 ? (
                <div className={style.emptyState}>
                    <div className={style.emptyIcon}>🗺️</div>
                    <h3>No hay asignaciones con coordenadas</h3>
                    <p>No se encontraron asignaciones que contengan información de ubicación.</p>
                </div>
            ) : (
                <div className={style.assignmentsList}>
                    {normalizedAssignments.map(assignment => (
                        <div key={assignment.id} className={style.assignmentItem}>
                            <div className={style.assignmentHeader}>
                                <h4>{assignment.conductor || 'Conductor no asignado'}</h4>
                                <span className={style.assignmentStatus}>
                                    {assignment.estado || 'Sin estado'}
                                </span>
                            </div>
                            <div className={style.assignmentBody}>
                                <div className={style.locationInfo}>
                                    <div className={style.location}>
                                        <span className={style.locationIcon}>📍</span>
                                        <div>
                                            <strong>Origen:</strong>
                                            <p>{assignment.origen}</p>
                                            {assignment.originCoords && (
                                                <small>({assignment.originCoords.lat.toFixed(4)}, {assignment.originCoords.lng.toFixed(4)})</small>
                                            )}
                                        </div>
                                    </div>
                                    <div className={style.arrow}>→</div>
                                    <div className={style.location}>
                                        <span className={style.locationIcon}>🎯</span>
                                        <div>
                                            <strong>Destino:</strong>
                                            <p>{assignment.destino}</p>
                                            {assignment.destCoords && (
                                                <small>({assignment.destCoords.lat.toFixed(4)}, {assignment.destCoords.lng.toFixed(4)})</small>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className={style.vehicleInfo}>
                                    <span>🚗 <strong>Vehículo:</strong> {assignment.vehiculo || 'No asignado'}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );

    if (!assignments || assignments.length === 0) {
        return (
            <div className={style.container}>
                <div className={style.emptyState}>
                    <div className={style.emptyIcon}>🗺️</div>
                    <h3>No hay asignaciones disponibles</h3>
                    <p>No se encontraron asignaciones para mostrar.</p>
                </div>
            </div>
        );
    }

    return (
        <div className={style.container}>
            {/* Header con controles */}
            <div className={style.header}>
                <div className={style.headerInfo}>
                    <h3>📍 Visualización de Asignaciones</h3>
                    <p>{normalizedAssignments.length} asignaciones con coordenadas de {assignments.length} totales</p>
                </div>
                <div className={style.viewControls}>
                    <button
                        className={`${style.viewButton} ${viewMode === 'map' ? style.active : ''}`}
                        onClick={() => setViewMode('map')}
                    >
                        🗺️ Vista Mapa
                    </button>
                    <button
                        className={`${style.viewButton} ${viewMode === 'list' ? style.active : ''}`}
                        onClick={() => setViewMode('list')}
                    >
                        📋 Vista Lista
                    </button>
                </div>
            </div>

            {/* Estadísticas rápidas */}
            <div className={style.statsBar}>
                <div className={style.stat}>
                    <span className={style.statNumber}>{normalizedAssignments.length}</span>
                    <span className={style.statLabel}>Con Coordenadas</span>
                </div>
                <div className={style.stat}>
                    <span className={style.statNumber}>{normalizedAssignments.filter(a => a.originCoords && a.destCoords).length}</span>
                    <span className={style.statLabel}>Rutas Completas</span>
                </div>
                <div className={style.stat}>
                    <span className={style.statNumber}>{new Set(normalizedAssignments.map(a => a.vehiculo).filter(Boolean)).size}</span>
                    <span className={style.statLabel}>Vehículos</span>
                </div>
                <div className={style.stat}>
                    <span className={style.statNumber}>{new Set(normalizedAssignments.map(a => a.conductor).filter(Boolean)).size}</span>
                    <span className={style.statLabel}>Conductores</span>
                </div>
            </div>

            {/* Contenido principal */}
            <div className={style.content}>
                {viewMode === 'map' ? renderSimulatedMap() : renderListView()}
            </div>

            {/* Footer informativo */}
            <div className={style.footer}>
                <p>💡 <strong>Tip:</strong> {viewMode === 'map' ? 'Haz clic en los marcadores para ver más información' : 'Usa la vista de mapa para visualizar las ubicaciones'}</p>
                <small>Última actualización: {new Date().toLocaleString()}</small>
            </div>
        </div>
    );
};

export default SimpleAssignmentView;
