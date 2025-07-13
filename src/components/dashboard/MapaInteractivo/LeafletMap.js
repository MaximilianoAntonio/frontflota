// src/components/dashboard/MapaInteractivo/LeafletMap.js
import { h } from 'preact';
import { useEffect, useRef } from 'preact/hooks';
import L from 'leaflet';

// Configurar iconos de Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const LeafletMap = ({ 
    center = [-33.0472, -71.6127], 
    zoom = 11, 
    asignaciones = [], 
    onAsignacionSelect = () => {},
    vistaMapa = 'tiempo_real'
}) => {
    const mapRef = useRef(null);
    const mapInstanceRef = useRef(null);
    const markersRef = useRef([]);

    // Iconos personalizados
    const iconos = {
        vehiculo_disponible: L.divIcon({
            html: `<div style="background: #28a745; color: white; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: bold;">🚗</div>`,
            iconSize: [24, 24],
            className: 'custom-leaflet-icon'
        }),
        vehiculo_en_ruta: L.divIcon({
            html: `<div style="background: #007bff; color: white; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: bold;">🚙</div>`,
            iconSize: [24, 24],
            className: 'custom-leaflet-icon'
        }),
        punto_inicio: L.divIcon({
            html: `<div style="background: #28a745; color: white; border-radius: 50%; width: 20px; height: 20px; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: bold;">S</div>`,
            iconSize: [20, 20],
            className: 'custom-leaflet-icon'
        }),
        punto_fin: L.divIcon({
            html: `<div style="background: #dc3545; color: white; border-radius: 50%; width: 20px; height: 20px; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: bold;">F</div>`,
            iconSize: [20, 20],
            className: 'custom-leaflet-icon'
        })
    };

    // Inicializar mapa
    useEffect(() => {
        if (!mapRef.current) return;

        // Crear instancia del mapa
        const map = L.map(mapRef.current).setView(center, zoom);

        // Agregar capa de tiles
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);

        mapInstanceRef.current = map;

        return () => {
            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove();
                mapInstanceRef.current = null;
            }
        };
    }, []);

    // Limpiar marcadores
    const limpiarMarcadores = () => {
        markersRef.current.forEach(marker => {
            if (mapInstanceRef.current) {
                mapInstanceRef.current.removeLayer(marker);
            }
        });
        markersRef.current = [];
    };

    // Actualizar marcadores cuando cambian las asignaciones
    useEffect(() => {
        if (!mapInstanceRef.current || !asignaciones) return;

        limpiarMarcadores();

        asignaciones.forEach(asignacion => {
            if (!asignacion.coordenadas) return;

            const coordenada = asignacion.coordenadas.actual || asignacion.coordenadas.inicio || asignacion.coordenadas;
            
            if (!coordenada || !coordenada.lat || !coordenada.lng) return;

            const icono = asignacion.estado === 'en_curso' ? iconos.vehiculo_en_ruta : iconos.vehiculo_disponible;
            
            const marker = L.marker([coordenada.lat, coordenada.lng], { icon: icono })
                .bindPopup(`
                    <div>
                        <h4>${asignacion.descripcion || 'Asignación sin título'}</h4>
                        <p><strong>Estado:</strong> ${asignacion.estado || 'Sin estado'}</p>
                        <p><strong>Vehículo:</strong> ${asignacion.vehiculo?.patente || 'N/A'}</p>
                        <p><strong>Conductor:</strong> ${asignacion.conductor ? `${asignacion.conductor.nombre} ${asignacion.conductor.apellido}` : 'N/A'}</p>
                        ${asignacion.velocidadActual ? `<p><strong>Velocidad:</strong> ${asignacion.velocidadActual} km/h</p>` : ''}
                    </div>
                `)
                .on('click', () => {
                    onAsignacionSelect(asignacion);
                });

            marker.addTo(mapInstanceRef.current);
            markersRef.current.push(marker);
        });

        // Ajustar vista si hay asignaciones
        if (asignaciones.length > 0 && markersRef.current.length > 0) {
            const group = new L.featureGroup(markersRef.current);
            mapInstanceRef.current.fitBounds(group.getBounds().pad(0.1));
        }

    }, [asignaciones, vistaMapa]);

    return (
        <div 
            ref={mapRef} 
            style={{ 
                height: '100%', 
                width: '100%',
                borderRadius: '8px',
                overflow: 'hidden'
            }}
        />
    );
};

export default LeafletMap;
