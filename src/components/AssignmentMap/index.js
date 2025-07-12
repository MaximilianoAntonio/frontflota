import { h } from 'preact';
import { useState, useEffect, useRef } from 'preact/hooks';

const AssignmentMap = ({ assignments = [], height = '400px' }) => {
    const mapRef = useRef(null);
    const [map, setMap] = useState(null);
    const [filtroEstado, setFiltroEstado] = useState('todos');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const initializeMap = async () => {
            try {
                setIsLoading(true);
                
                // Cargar Leaflet CSS
                if (!document.querySelector('link[href*="leaflet"]')) {
                    const leafletCSS = document.createElement('link');
                    leafletCSS.rel = 'stylesheet';
                    leafletCSS.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
                    document.head.appendChild(leafletCSS);
                }

                // Cargar Leaflet JS
                const L = await import('leaflet');
                
                if (mapRef.current && !map) {
                    // Configurar iconos de Leaflet
                    delete L.Icon.Default.prototype._getIconUrl;
                    L.Icon.Default.mergeOptions({
                        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
                        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
                        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
                    });

                    // Inicializar el mapa
                    const mapInstance = L.map(mapRef.current).setView([-33.4489, -70.6693], 12);

                    // Agregar capa de tiles
                    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                        attribution: '© OpenStreetMap contributors'
                    }).addTo(mapInstance);

                    setMap(mapInstance);
                    setError(null);
                }
            } catch (err) {
                console.error('Error initializing map:', err);
                setError('Error al cargar el mapa. Verifique su conexión a internet.');
            } finally {
                setIsLoading(false);
            }
        };

        initializeMap();

        // Cleanup function
        return () => {
            if (map) {
                map.remove();
                setMap(null);
            }
        };
    }, []);

    useEffect(() => {
        const addMarkersToMap = async () => {
            if (map && assignments.length > 0) {
                try {
                    const L = await import('leaflet');
                    
                    // Filtrar asignaciones según el estado seleccionado
                    const asignacionesFiltradas = filtroEstado === 'todos' 
                        ? assignments 
                        : assignments.filter(a => a.estado === filtroEstado);

                    // Limpiar marcadores existentes
                    map.eachLayer((layer) => {
                        if (layer instanceof L.Marker) {
                            map.removeLayer(layer);
                        }
                    });

                    const markers = [];

                    asignacionesFiltradas.forEach((assignment) => {
                        if (assignment.origen_latitud && assignment.origen_longitud) {
                            // Crear marcador verde para origen
                            const origenIcon = L.icon({
                                iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',
                                shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
                                iconSize: [25, 41],
                                iconAnchor: [12, 41],
                                popupAnchor: [1, -34],
                                shadowSize: [41, 41]
                            });

                            const origenMarker = L.marker([assignment.origen_latitud, assignment.origen_longitud], {
                                icon: origenIcon
                            }).addTo(map);

                            origenMarker.bindPopup(`
                                <div style="min-width: 200px;">
                                    <h6 style="margin: 0 0 10px 0; color: #28a745;"><strong>📍 Origen</strong></h6>
                                    <p style="margin: 5px 0;"><strong>Descripción:</strong> ${assignment.origen_descripcion || 'N/A'}</p>
                                    <p style="margin: 5px 0;"><strong>Vehículo:</strong> ${assignment.vehiculo__patente || 'N/A'}</p>
                                    <p style="margin: 5px 0;"><strong>Conductor:</strong> ${assignment.conductor__nombre} ${assignment.conductor__apellido}</p>
                                    <p style="margin: 5px 0;"><strong>Estado:</strong> <span style="padding: 2px 6px; border-radius: 3px; background: ${assignment.estado === 'completada' ? '#d4edda' : assignment.estado === 'activa' ? '#d1ecf1' : '#f8d7da'}; color: ${assignment.estado === 'completada' ? '#155724' : assignment.estado === 'activa' ? '#0c5460' : '#721c24'};">${assignment.estado}</span></p>
                                </div>
                            `);

                            markers.push(origenMarker);
                        }

                        if (assignment.destino_latitud && assignment.destino_longitud) {
                            // Crear marcador rojo para destino
                            const destinoIcon = L.icon({
                                iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
                                shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
                                iconSize: [25, 41],
                                iconAnchor: [12, 41],
                                popupAnchor: [1, -34],
                                shadowSize: [41, 41]
                            });

                            const destinoMarker = L.marker([assignment.destino_latitud, assignment.destino_longitud], {
                                icon: destinoIcon
                            }).addTo(map);

                            destinoMarker.bindPopup(`
                                <div style="min-width: 200px;">
                                    <h6 style="margin: 0 0 10px 0; color: #dc3545;"><strong>🎯 Destino</strong></h6>
                                    <p style="margin: 5px 0;"><strong>Descripción:</strong> ${assignment.destino_descripcion}</p>
                                    <p style="margin: 5px 0;"><strong>Fecha:</strong> ${new Date(assignment.fecha_hora_requerida_inicio).toLocaleString()}</p>
                                    <p style="margin: 5px 0;"><strong>Vehículo:</strong> ${assignment.vehiculo__patente || 'N/A'}</p>
                                    <p style="margin: 5px 0;"><strong>Conductor:</strong> ${assignment.conductor__nombre} ${assignment.conductor__apellido}</p>
                                </div>
                            `);

                            markers.push(destinoMarker);
                        }
                    });

                    // Ajustar vista del mapa a los marcadores
                    if (markers.length > 0) {
                        const group = new L.featureGroup(markers);
                        map.fitBounds(group.getBounds().pad(0.1));
                    }
                } catch (err) {
                    console.error('Error adding markers:', err);
                }
            }
        };

        addMarkersToMap();
    }, [map, assignments, filtroEstado]);

    const handleFiltroChange = (estado) => {
        setFiltroEstado(estado);
    };

    const estadosUnicos = [...new Set(assignments.map(a => a.estado))];

    if (error) {
        return (
            <div style={{ 
                height, 
                width: '100%', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                backgroundColor: '#f8f9fa',
                border: '1px solid #dee2e6',
                borderRadius: '5px'
            }}>
                <div style={{ textAlign: 'center', padding: '20px' }}>
                    <h5 style={{ color: '#dc3545', marginBottom: '10px' }}>❌ Error en el Mapa</h5>
                    <p style={{ color: '#6c757d', margin: '0' }}>{error}</p>
                    <button 
                        onClick={() => window.location.reload()} 
                        style={{
                            marginTop: '10px',
                            padding: '8px 16px',
                            backgroundColor: '#007bff',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer'
                        }}
                    >
                        🔄 Recargar Página
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div style={{ height, width: '100%', position: 'relative' }}>
            {isLoading && (
                <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(255, 255, 255, 0.8)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 2000
                }}>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{
                            width: '40px',
                            height: '40px',
                            border: '4px solid #f3f3f3',
                            borderTop: '4px solid #007bff',
                            borderRadius: '50%',
                            animation: 'spin 1s linear infinite',
                            margin: '0 auto 10px'
                        }} />
                        <p style={{ margin: 0, color: '#6c757d' }}>Cargando mapa...</p>
                    </div>
                </div>
            )}

            {/* Controles de filtro */}
            {!isLoading && !error && (
                <div style={{
                    position: 'absolute',
                    top: '10px',
                    right: '10px',
                    zIndex: 1000,
                    background: 'rgba(255, 255, 255, 0.95)',
                    padding: '12px',
                    borderRadius: '8px',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                    border: '1px solid #dee2e6'
                }}>
                    <div style={{ marginBottom: '8px', fontSize: '13px', fontWeight: 'bold', color: '#495057' }}>
                        Filtrar por estado:
                    </div>
                    <button
                        onClick={() => handleFiltroChange('todos')}
                        style={{
                            margin: '2px',
                            padding: '6px 10px',
                            fontSize: '12px',
                            border: '1px solid #ccc',
                            borderRadius: '4px',
                            background: filtroEstado === 'todos' ? '#007bff' : 'white',
                            color: filtroEstado === 'todos' ? 'white' : 'black',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                        }}
                    >
                        Todos ({assignments.length})
                    </button>
                    {estadosUnicos.map(estado => (
                        <button
                            key={estado}
                            onClick={() => handleFiltroChange(estado)}
                            style={{
                                margin: '2px',
                                padding: '6px 10px',
                                fontSize: '12px',
                                border: '1px solid #ccc',
                                borderRadius: '4px',
                                background: filtroEstado === estado ? '#007bff' : 'white',
                                color: filtroEstado === estado ? 'white' : 'black',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                        >
                            {estado} ({assignments.filter(a => a.estado === estado).length})
                        </button>
                    ))}
                </div>
            )}

            {/* Leyenda */}
            {!isLoading && !error && (
                <div style={{
                    position: 'absolute',
                    bottom: '10px',
                    left: '10px',
                    zIndex: 1000,
                    background: 'rgba(255, 255, 255, 0.95)',
                    padding: '12px',
                    borderRadius: '8px',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                    border: '1px solid #dee2e6',
                    fontSize: '13px'
                }}>
                    <div style={{ marginBottom: '8px', fontWeight: 'bold', color: '#495057' }}>Leyenda:</div>
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '4px' }}>
                        <div style={{
                            width: '14px',
                            height: '14px',
                            borderRadius: '50%',
                            backgroundColor: '#28a745',
                            marginRight: '8px'
                        }} />
                        <span style={{ color: '#495057' }}>Origen</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        <div style={{
                            width: '14px',
                            height: '14px',
                            borderRadius: '50%',
                            backgroundColor: '#dc3545',
                            marginRight: '8px'
                        }} />
                        <span style={{ color: '#495057' }}>Destino</span>
                    </div>
                </div>
            )}

            {/* Contenedor del mapa */}
            <div ref={mapRef} style={{ height: '100%', width: '100%', borderRadius: '8px' }} />

            {/* CSS para animación de carga */}
            <style>{`
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
};

export default AssignmentMap;
