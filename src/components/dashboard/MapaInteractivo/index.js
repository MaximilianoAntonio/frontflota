// src/components/dashboard/MapaInteractivo/index.js
import { h } from 'preact';
import { useEffect, useRef } from 'preact/hooks';
import L from 'leaflet';
// Iconos por defecto de Leaflet CDN
const defaultIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});
import style from './style.css';
import 'leaflet/dist/leaflet.css';

const MapaInteractivo = ({
  asignaciones = [],
  vistaMapa = 'tiempo_real',
  filtros = {},
  onAsignacionSelect = () => {},
  asignacionSeleccionada = null
}) => {
  const mapRef = useRef(null);
  const mapaInstancia = useRef(null);
  const centroMapa = [-33.0472, -71.6127]; // Valparaíso, Chile
  const zoomMapa = 11;

  useEffect(() => {
    if (!mapaInstancia.current && mapRef.current) {
      mapaInstancia.current = L.map(mapRef.current).setView(centroMapa, zoomMapa);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(mapaInstancia.current);
    }
  }, [mapRef]);

  useEffect(() => {
    const map = mapaInstancia.current;
    if (!map) return;

    console.log('Asignaciones recibidas en MapaInteractivo:', asignaciones);
    asignaciones.forEach((asignacion, idx) => {
      console.log(`Asignación #${idx} coordenadas:`, asignacion.coordenadas);
    });
    // Eliminar marcadores y rutas anteriores
    map.eachLayer(layer => {
      if (layer instanceof L.Marker || layer instanceof L.Polyline) {
        map.removeLayer(layer);
      }
    });

    asignaciones.forEach(asignacion => {
      // Usar inicio y fin si existen
      const inicio = asignacion.coordenadas?.inicio;
      const fin = asignacion.coordenadas?.fin;
      // Si ambos existen y son válidos, dibujar línea y ambos marcadores
      if (
        inicio && fin &&
        typeof inicio.lat === 'number' && typeof inicio.lng === 'number' &&
        typeof fin.lat === 'number' && typeof fin.lng === 'number'
      ) {
        // Línea entre origen y destino
        L.polyline([
          [inicio.lat, inicio.lng],
          [fin.lat, fin.lng]
        ], { color: '#007bff', weight: 4 }).addTo(map);
        // Marcador origen
        const markerInicio = L.marker([inicio.lat, inicio.lng], { icon: defaultIcon }).addTo(map);
        markerInicio.bindPopup(`
          <div>
            <strong>Origen:</strong> ${asignacion.origen_descripcion || 'Sin información'}<br/>
            <strong>Vehículo:</strong> ${asignacion.vehiculo?.patente || 'No asignado'}<br/>
            <strong>Conductor:</strong> ${asignacion.conductor ? `${asignacion.conductor.nombre || ''} ${asignacion.conductor.apellido || ''}`.trim() : 'No asignado'}<br/>
            <strong>Descripción:</strong> ${asignacion.descripcion || 'Sin información'}
          </div>
        `);
        markerInicio.on('click', () => onAsignacionSelect(asignacion));
        // Marcador destino
        const markerFin = L.marker([fin.lat, fin.lng], { icon: defaultIcon }).addTo(map);
        markerFin.bindPopup(`
          <div>
            <strong>Destino:</strong> ${asignacion.destino_descripcion || 'Sin información'}<br/>
            <strong>Vehículo:</strong> ${asignacion.vehiculo?.patente || 'No asignado'}<br/>
            <strong>Conductor:</strong> ${asignacion.conductor ? `${asignacion.conductor.nombre || ''} ${asignacion.conductor.apellido || ''}`.trim() : 'No asignado'}<br/>
            <strong>Descripción:</strong> ${asignacion.descripcion || 'Sin información'}
          </div>
        `);
        markerFin.on('click', () => onAsignacionSelect(asignacion));
      } else {
        // Si solo hay una coordenada válida, mostrar un solo marcador
        let coord = asignacion.coordenadas?.actual || asignacion.coordenadas?.inicio || asignacion.coordenadas?.fin;
        if (coord && typeof coord.lat === 'number' && typeof coord.lng === 'number') {
          const marker = L.marker([coord.lat, coord.lng], { icon: defaultIcon }).addTo(map);
          marker.bindPopup(`
            <div>
              <strong>Asignación</strong><br/>
              <strong>Origen:</strong> ${asignacion.origen_descripcion || 'Sin información'}<br/>
              <strong>Destino:</strong> ${asignacion.destino_descripcion || 'Sin información'}<br/>
              <strong>Vehículo:</strong> ${asignacion.vehiculo?.patente || 'No asignado'}<br/>
              <strong>Conductor:</strong> ${asignacion.conductor ? `${asignacion.conductor.nombre || ''} ${asignacion.conductor.apellido || ''}`.trim() : 'No asignado'}<br/>
              <strong>Descripción:</strong> ${asignacion.descripcion || 'Sin información'}
            </div>
          `);
          marker.on('click', () => onAsignacionSelect(asignacion));
        }
      }
    });
  }, [asignaciones, vistaMapa, filtros, onAsignacionSelect]);

  return (
    <div className={style.mapaContainer}>
      <div ref={mapRef} style={{ height: '100%', width: '100%' }} className={style.leafletMap}></div>
      {/* Leyenda y controles personalizados */}
      <div className={style.leyenda}>
        <h4>Leyenda</h4>
        {vistaMapa === 'tiempo_real' && (
          <div>
            <div className={style.leyendaItem}>
              <div className={style.leyendaCirculo} style={{ backgroundColor: '#007bff' }}></div>
              <span>En Ruta</span>
            </div>
            <div className={style.leyendaItem}>
              <div className={style.leyendaCirculo} style={{ backgroundColor: '#28a745' }}></div>
              <span>Disponible</span>
            </div>
            <div className={style.leyendaItem}>
              <div className={style.leyendaCirculo} style={{ backgroundColor: '#dc3545' }}></div>
              <span>Urgente</span>
            </div>
          </div>
        )}
        {vistaMapa === 'rutas' && (
          <div>
            <div className={style.leyendaItem}>
              <div className={style.leyendaCirculo} style={{ backgroundColor: '#007bff' }}></div>
              <span>Ruta</span>
            </div>
            <div className={style.leyendaItem}>
              <div className={style.leyendaCirculo} style={{ backgroundColor: '#28a745' }}></div>
              <span>Inicio</span>
            </div>
            <div className={style.leyendaItem}>
              <div className={style.leyendaCirculo} style={{ backgroundColor: '#dc3545' }}></div>
              <span>Fin</span>
            </div>
          </div>
        )}
        <div className={style.leyendaItem}>
          <div className={style.leyendaCirculo} style={{ backgroundColor: '#6c757d' }}></div>
          <span>Cancelada</span>
        </div>
      </div>
      {/* Controles del mapa personalizados si los necesitas */}
      <div className={style.controlesMap}></div>
    </div>
  );
};

export default MapaInteractivo;
