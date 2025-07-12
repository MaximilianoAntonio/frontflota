import { h } from 'preact';
import { useState, useEffect, useRef } from 'preact/hooks';
import StaticMap from '../StaticMap';

const AssignmentMap = ({ assignments = [], height = '400px' }) => {
    const mapRef = useRef(null);
    const [map, setMap] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [leafletLoaded, setLeafletLoaded] = useState(false);
    const [useStaticMap, setUseStaticMap] = useState(false);

    // Cargar Leaflet de forma asíncrona
    useEffect(() => {
        const loadLeaflet = async () => {
            try {
                setIsLoading(true);
                setError(null);

                // Verificar si Leaflet ya está cargado
                if (window.L) {
                    setLeafletLoaded(true);
                    setIsLoading(false);
                    return;
                }

                // Cargar CSS de Leaflet
                if (!document.querySelector('link[href*="leaflet"]')) {
                    const cssLink = document.createElement('link');
                    cssLink.rel = 'stylesheet';
                    cssLink.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
                    cssLink.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';
                    cssLink.crossOrigin = '';
                    document.head.appendChild(cssLink);
                }

                // Cargar JavaScript de Leaflet
                const script = document.createElement('script');
                script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
                script.integrity = 'sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=';
                script.crossOrigin = '';
                
                script.onload = () => {
                    setLeafletLoaded(true);
                    setIsLoading(false);
                };
                
                script.onerror = () => {
                    console.warn('Leaflet failed to load, using static map');
                    setUseStaticMap(true);
                    setIsLoading(false);
                };

                document.head.appendChild(script);

                // Timeout como fallback
                setTimeout(() => {
                    if (!window.L && !useStaticMap) {
                        console.warn('Leaflet timeout, using static map');
                        setUseStaticMap(true);
                        setIsLoading(false);
                    }
                }, 10000);

            } catch (err) {
                console.error('Error loading Leaflet:', err);
                console.warn('Using static map as fallback');
                setUseStaticMap(true);
                setIsLoading(false);
            }
        };

        loadLeaflet();
    }, []);

    // Inicializar mapa cuando Leaflet esté cargado
    useEffect(() => {
        if (!leafletLoaded || !mapRef.current || map || useStaticMap) return;

        try {
            // Crear mapa centrado en Chile
            const newMap = window.L.map(mapRef.current, {
                center: [-33.4489, -70.6693], // Santiago, Chile
                zoom: 10,
                zoomControl: true,
                scrollWheelZoom: true
            });

            // Agregar capa base de OpenStreetMap
            window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors',
                maxZoom: 18
            }).addTo(newMap);

            setMap(newMap);
        } catch (err) {
            console.error('Error creating map:', err);
            console.warn('Map creation failed, using static map');
            setUseStaticMap(true);
        }
    }, [leafletLoaded, useStaticMap]);

    // Agregar marcadores cuando el mapa esté listo
    useEffect(() => {
        if (!map || !window.L || !assignments?.length || useStaticMap) return;

        try {
            // Limpiar marcadores existentes
            map.eachLayer((layer) => {
                if (layer instanceof window.L.Marker) {
                    map.removeLayer(layer);
                }
            });

            const bounds = [];

            assignments.forEach((assignment, index) => {
                if (!assignment) return;

                // Función para extraer coordenadas
                const extractCoords = (location) => {
                    if (!location) return null;
                    const regex = /(-?\d+\.?\d*),\s*(-?\d+\.?\d*)/;
                    const match = location.match(regex);
                    return match ? [parseFloat(match[1]), parseFloat(match[2])] : null;
                };

                const originCoords = extractCoords(assignment.origen);
                const destCoords = extractCoords(assignment.destino);

                // Icono personalizado para origen
                const originIcon = window.L.divIcon({
                    html: '<div style="background:#4CAF50;color:white;border-radius:50%;width:24px;height:24px;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:bold;border:2px solid white;box-shadow:0 2px 4px rgba(0,0,0,0.3);">📍</div>',
                    className: 'custom-div-icon',
                    iconSize: [24, 24],
                    iconAnchor: [12, 12]
                });

                // Icono personalizado para destino
                const destIcon = window.L.divIcon({
                    html: '<div style="background:#FF5722;color:white;border-radius:50%;width:24px;height:24px;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:bold;border:2px solid white;box-shadow:0 2px 4px rgba(0,0,0,0.3);">🎯</div>',
                    className: 'custom-div-icon',
                    iconSize: [24, 24],
                    iconAnchor: [12, 12]
                });

                // Agregar marcador de origen
                if (originCoords) {
                    const originMarker = window.L.marker(originCoords, { icon: originIcon })
                        .addTo(map)
                        .bindPopup(`
                            <div style="font-family: Arial, sans-serif; line-height: 1.4;">
                                <h4 style="margin: 0 0 8px 0; color: #4CAF50;">📍 Punto de Origen</h4>
                                <p style="margin: 4px 0;"><strong>Conductor:</strong> ${assignment.conductor || 'No asignado'}</p>
                                <p style="margin: 4px 0;"><strong>Vehículo:</strong> ${assignment.vehiculo || 'No asignado'}</p>
                                <p style="margin: 4px 0;"><strong>Ubicación:</strong> ${assignment.origen}</p>
                                <p style="margin: 4px 0;"><strong>Coordenadas:</strong> ${originCoords[0]}, ${originCoords[1]}</p>
                            </div>
                        `);
                    bounds.push(originCoords);
                }

                // Agregar marcador de destino
                if (destCoords) {
                    const destMarker = window.L.marker(destCoords, { icon: destIcon })
                        .addTo(map)
                        .bindPopup(`
                            <div style="font-family: Arial, sans-serif; line-height: 1.4;">
                                <h4 style="margin: 0 0 8px 0; color: #FF5722;">🎯 Punto de Destino</h4>
                                <p style="margin: 4px 0;"><strong>Conductor:</strong> ${assignment.conductor || 'No asignado'}</p>
                                <p style="margin: 4px 0;"><strong>Vehículo:</strong> ${assignment.vehiculo || 'No asignado'}</p>
                                <p style="margin: 4px 0;"><strong>Ubicación:</strong> ${assignment.destino}</p>
                                <p style="margin: 4px 0;"><strong>Coordenadas:</strong> ${destCoords[0]}, ${destCoords[1]}</p>
                            </div>
                        `);
                    bounds.push(destCoords);
                }

                // Agregar línea entre origen y destino
                if (originCoords && destCoords) {
                    window.L.polyline([originCoords, destCoords], {
                        color: '#2196F3',
                        weight: 3,
                        opacity: 0.7,
                        dashArray: '5, 10'
                    }).addTo(map);
                }
            });

            // Ajustar vista para mostrar todos los marcadores
            if (bounds.length > 0) {
                const group = new window.L.featureGroup(bounds.map(coord => window.L.marker(coord)));
                map.fitBounds(group.getBounds().pad(0.1));
            }

        } catch (err) {
            console.error('Error adding markers:', err);
            console.warn('Marker creation failed, using static map');
            setUseStaticMap(true);
        }
    }, [map, assignments, useStaticMap]);

    // Si debe usar mapa estático
    if (useStaticMap) {
        return (
            <div style={{ height }}>
                <div style={{
                    background: '#e3f2fd',
                    padding: '8px 12px',
                    borderRadius: '4px 4px 0 0',
                    fontSize: '12px',
                    color: '#1976d2',
                    textAlign: 'center'
                }}>
                    📋 Vista de Asignaciones (Modo Lista) - El mapa interactivo no está disponible
                </div>
                <StaticMap assignments={assignments} />
            </div>
        );
    }

    if (isLoading) {
        return (
            <div style={{ 
                height, 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                background: '#f5f5f5',
                borderRadius: '8px',
                flexDirection: 'column',
                gap: '16px'
            }}>
                <div style={{
                    width: '40px',
                    height: '40px',
                    border: '4px solid #e3f2fd',
                    borderTop: '4px solid #2196F3',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                }}></div>
                <p style={{ margin: 0, color: '#666' }}>Cargando mapa interactivo...</p>
                <button 
                    onClick={() => setUseStaticMap(true)}
                    style={{
                        padding: '6px 12px',
                        background: '#667eea',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px'
                    }}
                >
                    📋 Usar vista de lista
                </button>
                <style>{`
                    @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }
                `}</style>
            </div>
        );
    }

    if (error) {
        return (
            <div style={{ 
                height, 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                background: '#fff3cd',
                border: '1px solid #ffeaa7',
                borderRadius: '8px',
                flexDirection: 'column',
                gap: '16px',
                padding: '20px',
                textAlign: 'center'
            }}>
                <div style={{ fontSize: '48px' }}>⚠️</div>
                <div>
                    <h3 style={{ margin: '0 0 8px 0', color: '#856404' }}>Error cargando el mapa</h3>
                    <p style={{ margin: '0 0 16px 0', color: '#856404' }}>{error}</p>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                        <button 
                            onClick={() => window.location.reload()}
                            style={{
                                padding: '8px 16px',
                                background: '#007bff',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer'
                            }}
                        >
                            🔄 Recargar página
                        </button>
                        <button 
                            onClick={() => setUseStaticMap(true)}
                            style={{
                                padding: '8px 16px',
                                background: '#667eea',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer'
                            }}
                        >
                            📋 Usar vista de lista
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div style={{ height, width: '100%', borderRadius: '8px', overflow: 'hidden' }}>
            <div style={{
                background: '#e8f5e8',
                padding: '4px 8px',
                fontSize: '11px',
                color: '#2e7d32',
                textAlign: 'center'
            }}>
                🗺️ Mapa Interactivo Activo
                <button 
                    onClick={() => setUseStaticMap(true)}
                    style={{
                        marginLeft: '8px',
                        padding: '2px 6px',
                        background: 'transparent',
                        border: '1px solid #2e7d32',
                        borderRadius: '3px',
                        color: '#2e7d32',
                        cursor: 'pointer',
                        fontSize: '10px'
                    }}
                >
                    📋 Cambiar a lista
                </button>
            </div>
            <div ref={mapRef} style={{ height: 'calc(100% - 24px)', width: '100%' }} />
        </div>
    );
};

export default AssignmentMap;
