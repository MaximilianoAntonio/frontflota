import { h } from 'preact';
import { useState } from 'preact/hooks';
import style from './style.css';

const MapaAsignaciones = ({ assignments = [] }) => {
    const [selectedAssignment, setSelectedAssignment] = useState(null);
    const [viewMode, setViewMode] = useState('mapa');
    const [filtroEstado, setFiltroEstado] = useState('todos');

    // Procesar asignaciones para extraer coordenadas
    const processAssignments = (assignments) => {
        console.log('Procesando asignaciones:', assignments);
        
        if (!assignments || assignments.length === 0) {
            console.log('No hay asignaciones para procesar');
            return [];
        }

        // Función para generar coordenadas aproximadas basadas en nombres de lugares de Chile
        const generateCoordsFromLocation = (locationDesc) => {
            if (!locationDesc) return null;
            
            const locations = {
                santiago: { lat: -33.4489, lng: -70.6693 },
                valparaiso: { lat: -33.0472, lng: -71.6127 },
                'viña del mar': { lat: -33.0153, lng: -71.5499 },
                concepcion: { lat: -36.8201, lng: -73.0444 },
                'la serena': { lat: -29.9027, lng: -71.2519 },
                quillota: { lat: -32.8836, lng: -71.2394 },
                'villa alemana': { lat: -33.0445, lng: -71.3726 },
                'los andes': { lat: -32.8336, lng: -70.5986 },
                'san felipe': { lat: -32.7500, lng: -70.7167 },
                limache: { lat: -33.0172, lng: -71.2697 },
                calera: { lat: -32.7833, lng: -71.2167 },
                'la calera': { lat: -32.7833, lng: -71.2167 },
                olmue: { lat: -33.0000, lng: -71.2000 },
                hijuelas: { lat: -32.8167, lng: -71.1667 },
                nogales: { lat: -32.8167, lng: -71.2333 },
                centro: { lat: -33.4489, lng: -70.6693 },
                'las condes': { lat: -33.4372, lng: -70.6506 },
                providencia: { lat: -33.3960, lng: -70.5991 },
                ñuñoa: { lat: -33.4734, lng: -70.6110 },
                maipu: { lat: -33.5202, lng: -70.7310 },
                'la reina': { lat: -33.4569, lng: -70.6483 },
                'buenos aires': { lat: -33.0445, lng: -71.3726 },
                ohiggins: { lat: -32.8836, lng: -71.2394 }
            };

            const desc = locationDesc.toLowerCase();
            
            // Buscar coincidencias exactas primero
            for (const [key, coords] of Object.entries(locations)) {
                if (desc.includes(key)) {
                    // Agregar un pequeño offset aleatorio para simular direcciones específicas
                    return {
                        lat: coords.lat + (Math.random() - 0.5) * 0.01,
                        lng: coords.lng + (Math.random() - 0.5) * 0.01
                    };
                }
            }

            // Si no encuentra ubicación específica, usar coordenadas por defecto de Chile central
            return {
                lat: -33.4489 + (Math.random() - 0.5) * 0.5,
                lng: -70.6693 + (Math.random() - 0.5) * 0.5
            };
        };

        return assignments.map((assignment, index) => {
            const extractCoords = (coordStr) => {
                if (!coordStr) return null;
                
                // Intentar diferentes formatos de coordenadas
                const patterns = [
                    /(-?\d+\.?\d*),\s*(-?\d+\.?\d*)/, // formato: "-33.4489, -70.6693"
                    /(-?\d+\.?\d*)\s+(-?\d+\.?\d*)/, // formato: "-33.4489 -70.6693"
                    /lat:\s*(-?\d+\.?\d*),?\s*lng?:\s*(-?\d+\.?\d*)/, // formato: "lat: -33.4489, lng: -70.6693"
                ];

                for (let pattern of patterns) {
                    const match = coordStr.toString().match(pattern);
                    if (match) {
                        return {
                            lat: parseFloat(match[1]),
                            lng: parseFloat(match[2])
                        };
                    }
                }
                return null;
            };

            // Intentar extraer coordenadas de los campos origen/destino
            let originCoords = extractCoords(assignment.origen);
            let destCoords = extractCoords(assignment.destino);

            // Si no hay coordenadas, generarlas basadas en las descripciones
            if (!originCoords && assignment.origen_descripcion) {
                originCoords = generateCoordsFromLocation(assignment.origen_descripcion);
            }
            if (!destCoords && assignment.destino_descripcion) {
                destCoords = generateCoordsFromLocation(assignment.destino_descripcion);
            }

            const processed = {
                id: assignment.id || index,
                conductor: assignment.conductor || `${assignment.conductor__nombre || ''} ${assignment.conductor__apellido || ''}`.trim(),
                vehiculo: assignment.vehiculo || assignment.vehiculo__patente || 'N/A',
                estado: assignment.estado || 'pendiente',
                origen: assignment.origen || '',
                destino: assignment.destino || '',
                origen_descripcion: assignment.origen_descripcion || 'Origen no especificado',
                destino_descripcion: assignment.destino_descripcion || 'Destino no especificado',
                fecha_hora: assignment.fecha_hora_requerida_inicio || assignment.fecha_hora || new Date().toISOString(),
                originCoords,
                destCoords
            };

            console.log(`Asignación ${index}:`, processed);
            return processed;
        }).filter(assignment => assignment.originCoords && assignment.destCoords);
    };

    const processedAssignments = processAssignments(assignments);

    // Filtrar asignaciones por estado
    const filteredAssignments = processedAssignments.filter(assignment => {
        if (filtroEstado === 'todos') return true;
        return assignment.estado === filtroEstado;
    });

    // Normalizar coordenadas para visualización
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

        const latRange = (maxLat - minLat) || 0.1;
        const lngRange = (maxLng - minLng) || 0.1;

        return assignments.map(a => ({
            ...a,
            originPos: a.originCoords ? {
                x: ((a.originCoords.lng - minLng) / lngRange) * 90 + 5,
                y: ((maxLat - a.originCoords.lat) / latRange) * 90 + 5
            } : null,
            destPos: a.destCoords ? {
                x: ((a.destCoords.lng - minLng) / lngRange) * 90 + 5,
                y: ((maxLat - a.destCoords.lat) / latRange) * 90 + 5
            } : null
        }));
    };

    const normalizedAssignments = normalizeCoordinates(filteredAssignments);

    const getEstadoColor = (estado) => {
        switch (estado) {
            case 'completada': return '#28a745';
            case 'activa': return '#007bff';
            case 'pendiente': return '#ffc107';
            case 'cancelada': return '#dc3545';
            default: return '#6c757d';
        }
    };

    const getEstadoLabel = (estado) => {
        switch (estado) {
            case 'completada': return 'Completada';
            case 'activa': return 'Activa';
            case 'pendiente': return 'Pendiente';
            case 'cancelada': return 'Cancelada';
            default: return 'Desconocido';
        }
    };

    const estadosUnicos = [...new Set(processedAssignments.map(a => a.estado))];

    const renderMapaView = () => (
        <div className={style.mapaContainer}>
            <div className={style.mapCanvas}>
                {/* Grid de fondo */}
                <div className={style.mapGrid} />

                {/* Líneas de conexión */}
                <svg className={style.connectionSvg} viewBox="0 0 100 100" preserveAspectRatio="none">
                    {normalizedAssignments.map(assignment => 
                        assignment.originPos && assignment.destPos && (
                            <line
                                key={`line-${assignment.id}`}
                                x1={assignment.originPos.x}
                                y1={assignment.originPos.y}
                                x2={assignment.destPos.x}
                                y2={assignment.destPos.y}
                                stroke={getEstadoColor(assignment.estado)}
                                strokeWidth="0.5"
                                strokeDasharray="2,1"
                                opacity="0.8"
                            />
                        )
                    )}
                </svg>

                {/* Marcadores de origen */}
                {normalizedAssignments.map(assignment => 
                    assignment.originPos && (
                        <div
                            key={`origen-${assignment.id}`}
                            className={`${style.marcador} ${style.marcadorOrigen}`}
                            style={{
                                left: `${assignment.originPos.x}%`,
                                top: `${assignment.originPos.y}%`,
                                backgroundColor: getEstadoColor(assignment.estado)
                            }}
                            onClick={() => setSelectedAssignment(assignment)}
                            title={`Origen: ${assignment.origen_descripcion}`}
                        >
                            📍
                        </div>
                    )
                )}

                {/* Marcadores de destino */}
                {normalizedAssignments.map(assignment => 
                    assignment.destPos && (
                        <div
                            key={`destino-${assignment.id}`}
                            className={`${style.marcador} ${style.marcadorDestino}`}
                            style={{
                                left: `${assignment.destPos.x}%`,
                                top: `${assignment.destPos.y}%`,
                                backgroundColor: getEstadoColor(assignment.estado)
                            }}
                            onClick={() => setSelectedAssignment(assignment)}
                            title={`Destino: ${assignment.destino_descripcion}`}
                        >
                            🎯
                        </div>
                    )
                )}

                {/* Panel de información de asignación seleccionada */}
                {selectedAssignment && (
                    <div className={style.infoPanel}>
                        <div className={style.infoPanelHeader}>
                            <h4>Asignación #{selectedAssignment.id}</h4>
                            <button 
                                className={style.closeBtn}
                                onClick={() => setSelectedAssignment(null)}
                            >
                                ✕
                            </button>
                        </div>
                        <div className={style.infoPanelContent}>
                            <div className={style.infoRow}>
                                <strong>Conductor:</strong> {selectedAssignment.conductor}
                            </div>
                            <div className={style.infoRow}>
                                <strong>Vehículo:</strong> {selectedAssignment.vehiculo}
                            </div>
                            <div className={style.infoRow}>
                                <strong>Estado:</strong> 
                                <span 
                                    className={style.estadoBadge}
                                    style={{ backgroundColor: getEstadoColor(selectedAssignment.estado) }}
                                >
                                    {getEstadoLabel(selectedAssignment.estado)}
                                </span>
                            </div>
                            <div className={style.infoRow}>
                                <strong>Origen:</strong> {selectedAssignment.origen_descripcion}
                            </div>
                            <div className={style.infoRow}>
                                <strong>Destino:</strong> {selectedAssignment.destino_descripcion}
                            </div>
                            <div className={style.infoRow}>
                                <strong>Fecha:</strong> {new Date(selectedAssignment.fecha_hora).toLocaleString()}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );

    const renderListaView = () => (
        <div className={style.listaContainer}>
            {normalizedAssignments.length > 0 ? (
                <div className={style.assignmentsList}>
                    {normalizedAssignments.map(assignment => (
                        <div 
                            key={assignment.id} 
                            className={style.assignmentCard}
                            onClick={() => setSelectedAssignment(assignment)}
                        >
                            <div className={style.cardHeader}>
                                <h4>Asignación #{assignment.id}</h4>
                                <span 
                                    className={style.estadoBadge}
                                    style={{ backgroundColor: getEstadoColor(assignment.estado) }}
                                >
                                    {getEstadoLabel(assignment.estado)}
                                </span>
                            </div>
                            <div className={style.cardContent}>
                                <div className={style.cardRow}>
                                    <span className={style.cardLabel}>Conductor:</span>
                                    <span className={style.cardValue}>{assignment.conductor}</span>
                                </div>
                                <div className={style.cardRow}>
                                    <span className={style.cardLabel}>Vehículo:</span>
                                    <span className={style.cardValue}>{assignment.vehiculo}</span>
                                </div>
                                <div className={style.cardRow}>
                                    <span className={style.cardLabel}>Ruta:</span>
                                    <span className={style.cardValue}>
                                        {assignment.origen_descripcion} → {assignment.destino_descripcion}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className={style.noData}>
                    <h3>📍 No hay asignaciones para mostrar</h3>
                    <p>No se encontraron asignaciones con coordenadas válidas.</p>
                </div>
            )}
        </div>
    );

    return (
        <div className={style.mapaAsignaciones}>
            {/* Header con controles */}
            <div className={style.header}>
                <div className={style.stats}>
                    <div className={style.statItem}>
                        <span className={style.statNumber}>{processedAssignments.length}</span>
                        <span className={style.statLabel}>Con Coordenadas</span>
                    </div>
                    <div className={style.statItem}>
                        <span className={style.statNumber}>{assignments.length}</span>
                        <span className={style.statLabel}>Total</span>
                    </div>
                </div>

                <div className={style.controls}>
                    <div className={style.viewToggle}>
                        <button 
                            className={`${style.toggleBtn} ${viewMode === 'mapa' ? style.active : ''}`}
                            onClick={() => setViewMode('mapa')}
                        >
                            🗺️ Mapa
                        </button>
                        <button 
                            className={`${style.toggleBtn} ${viewMode === 'lista' ? style.active : ''}`}
                            onClick={() => setViewMode('lista')}
                        >
                            📋 Lista
                        </button>
                    </div>

                    <select 
                        className={style.filtroSelect}
                        value={filtroEstado}
                        onChange={(e) => setFiltroEstado(e.target.value)}
                    >
                        <option value="todos">Todos los estados</option>
                        {estadosUnicos.map(estado => (
                            <option key={estado} value={estado}>
                                {getEstadoLabel(estado)}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Leyenda */}
            <div className={style.leyenda}>
                {estadosUnicos.map(estado => (
                    <div key={estado} className={style.leyendaItem}>
                        <div 
                            className={style.leyendaColor}
                            style={{ backgroundColor: getEstadoColor(estado) }}
                         />
                        <span>{getEstadoLabel(estado)}</span>
                        <span className={style.leyendaCount}>
                            ({processedAssignments.filter(a => a.estado === estado).length})
                        </span>
                    </div>
                ))}
            </div>

            {/* Contenido principal */}
            <div className={style.content}>
                {viewMode === 'mapa' ? renderMapaView() : renderListaView()}
            </div>

            {/* Debug info (solo en desarrollo) */}
            {process.env.NODE_ENV === 'development' && (
                <div className={style.debugInfo}>
                    <details>
                        <summary>Debug Info</summary>
                        <pre>{JSON.stringify({
                            totalAssignments: assignments.length,
                            processedAssignments: processedAssignments.length,
                            filteredAssignments: filteredAssignments.length,
                            normalizedAssignments: normalizedAssignments.length
                        }, null, 2)}</pre>
                    </details>
                </div>
            )}
        </div>
    );
};

export default MapaAsignaciones;
