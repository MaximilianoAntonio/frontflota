// src/components/dashboard/MapaInteractivo/index.js
import { h } from 'preact';
import { useEffect, useRef } from 'preact/hooks';
import L from 'leaflet';
import style from './style.css';
import 'leaflet/dist/leaflet.css';

// Configurar iconos por defecto de Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const MapaInteractivo = ({
  asignaciones = [],
  vistaMapa = 'tiempo_real',
  filtros = {},
  onAsignacionSelect = () => {},
  asignacionSeleccionada = null,
  centro = { lat: -33.0472, lng: -71.6127 },
  zoom = 11
}) => {
  const mapRef = useRef(null);
  const mapaInstancia = useRef(null);
  const marcadoresRef = useRef([]);

  // Inicializar mapa
  useEffect(() => {
    if (!mapaInstancia.current && mapRef.current) {
      console.log('Inicializando mapa...');
      
      try {
        // Crear instancia del mapa
        mapaInstancia.current = L.map(mapRef.current, {
          center: [centro.lat, centro.lng],
          zoom: zoom,
          zoomControl: true,
          scrollWheelZoom: true,
          doubleClickZoom: true,
          boxZoom: true,
          keyboard: true,
          dragging: true,
          touchZoom: true,
          attributionControl: true
        });

        // Agregar capa de tiles
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          maxZoom: 19,
          tileSize: 256,
          zoomOffset: 0
        }).addTo(mapaInstancia.current);

        console.log('Mapa inicializado correctamente');
        
        // Forzar actualización del tamaño del mapa
        setTimeout(() => {
          if (mapaInstancia.current) {
            mapaInstancia.current.invalidateSize();
            console.log('Tamaño del mapa actualizado');
          }
        }, 100);
        
      } catch (error) {
        console.error('Error inicializando mapa:', error);
      }
    }

    // Cleanup function
    return () => {
      if (mapaInstancia.current) {
        console.log('Limpiando mapa...');
        mapaInstancia.current.remove();
        mapaInstancia.current = null;
        marcadoresRef.current = [];
      }
    };
  }, []);

  // Limpiar marcadores
  const limpiarMarcadores = () => {
    marcadoresRef.current.forEach(marker => {
      if (mapaInstancia.current && marker) {
        mapaInstancia.current.removeLayer(marker);
      }
    });
    marcadoresRef.current = [];
  };

  // Actualizar marcadores cuando cambien las asignaciones
  useEffect(() => {
    const map = mapaInstancia.current;
    if (!map || !asignaciones) return;

    console.log('Actualizando marcadores. Asignaciones:', asignaciones.length);
    
    // Limpiar marcadores existentes
    limpiarMarcadores();

    asignaciones.forEach((asignacion, idx) => {
      console.log(`Procesando asignación ${idx}:`, asignacion);
      
      try {
        // Usar coordenadas disponibles
        const inicio = asignacion.coordenadas?.inicio;
        const fin = asignacion.coordenadas?.fin;
        const actual = asignacion.coordenadas?.actual;

        // Si hay inicio y fin, dibujar ruta
        if (inicio && fin && 
            typeof inicio.lat === 'number' && typeof inicio.lng === 'number' &&
            typeof fin.lat === 'number' && typeof fin.lng === 'number') {
          
          console.log(`Creando ruta para asignación ${idx}`);
          
          // Línea entre origen y destino
          const polyline = L.polyline([
            [inicio.lat, inicio.lng],
            [fin.lat, fin.lng]
          ], { 
            color: asignacion.estado === 'en_curso' ? '#10b981' : '#3b82f6', 
            weight: 4,
            opacity: 0.7
          }).addTo(map);
          
          marcadoresRef.current.push(polyline);

          // Marcador de inicio
          const markerInicio = L.marker([inicio.lat, inicio.lng], {
            title: `Origen - ${asignacion.vehiculo?.patente || 'Sin vehículo'}`
          }).addTo(map);
          
          markerInicio.bindPopup(`
            <div class="${style.popupContent}">
              <h4>🚚 Punto de Inicio</h4>
              <p><strong>Origen:</strong> ${asignacion.origen_descripcion || 'Sin información'}</p>
              <p><strong>Vehículo:</strong> ${asignacion.vehiculo?.patente || 'No asignado'}</p>
              <p><strong>Conductor:</strong> ${asignacion.conductor ? 
                `${asignacion.conductor.nombre || ''} ${asignacion.conductor.apellido || ''}`.trim() : 
                'No asignado'}</p>
              <p><strong>Estado:</strong> <span class="${style[asignacion.estado] || ''}">${asignacion.estado || 'Sin estado'}</span></p>
            </div>
          `);
          
          markerInicio.on('click', () => {
            console.log('Marcador de inicio clickeado:', asignacion);
            onAsignacionSelect(asignacion);
          });
          
          marcadoresRef.current.push(markerInicio);

          // Marcador de destino
          const markerFin = L.marker([fin.lat, fin.lng], {
            title: `Destino - ${asignacion.vehiculo?.patente || 'Sin vehículo'}`
          }).addTo(map);
          
          markerFin.bindPopup(`
            <div class="${style.popupContent}">
              <h4>🎯 Punto de Destino</h4>
              <p><strong>Destino:</strong> ${asignacion.destino_descripcion || 'Sin información'}</p>
              <p><strong>Vehículo:</strong> ${asignacion.vehiculo?.patente || 'No asignado'}</p>
              <p><strong>Descripción:</strong> ${asignacion.descripcion || 'Sin información'}</p>
              <p><strong>Estado:</strong> <span class="${style[asignacion.estado] || ''}">${asignacion.estado || 'Sin estado'}</span></p>
            </div>
          `);
          
          markerFin.on('click', () => {
            console.log('Marcador de destino clickeado:', asignacion);
            onAsignacionSelect(asignacion);
          });
          
          marcadoresRef.current.push(markerFin);
          
        } else {
          // Si solo hay una coordenada disponible, mostrar un marcador simple
          let coord = actual || inicio || fin;
          
          if (coord && typeof coord.lat === 'number' && typeof coord.lng === 'number') {
            console.log(`Creando marcador simple para asignación ${idx}`);
            
            const marker = L.marker([coord.lat, coord.lng], {
              title: asignacion.vehiculo?.patente || 'Asignación'
            }).addTo(map);
            
            marker.bindPopup(`
              <div class="${style.popupContent}">
                <h4>📍 Asignación</h4>
                <p><strong>Origen:</strong> ${asignacion.origen_descripcion || 'Sin información'}</p>
                <p><strong>Destino:</strong> ${asignacion.destino_descripcion || 'Sin información'}</p>
                <p><strong>Vehículo:</strong> ${asignacion.vehiculo?.patente || 'No asignado'}</p>
                <p><strong>Conductor:</strong> ${asignacion.conductor ? 
                  `${asignacion.conductor.nombre || ''} ${asignacion.conductor.apellido || ''}`.trim() : 
                  'No asignado'}</p>
                <p><strong>Estado:</strong> <span class="${style[asignacion.estado] || ''}">${asignacion.estado || 'Sin estado'}</span></p>
              </div>
            `);
            
            marker.on('click', () => {
              console.log('Marcador simple clickeado:', asignacion);
              onAsignacionSelect(asignacion);
            });
            
            marcadoresRef.current.push(marker);
          }
        }
        
      } catch (error) {
        console.error(`Error procesando asignación ${idx}:`, error);
      }
    });

    console.log(`Total de marcadores/elementos creados: ${marcadoresRef.current.length}`);
    
    // Ajustar vista si hay marcadores
    if (marcadoresRef.current.length > 0) {
      try {
        const group = new L.featureGroup(marcadoresRef.current);
        map.fitBounds(group.getBounds().pad(0.1));
        console.log('Vista ajustada a los marcadores');
      } catch (error) {
        console.error('Error ajustando vista:', error);
      }
    }

  }, [asignaciones, vistaMapa, filtros, onAsignacionSelect]);

  // Actualizar centro del mapa
  useEffect(() => {
    if (mapaInstancia.current && centro) {
      mapaInstancia.current.setView([centro.lat, centro.lng], zoom);
    }
  }, [centro, zoom]);

  return (
    <div className={style.mapaContainer}>
      <div 
        ref={mapRef} 
        className={style.leafletMap}
        style={{ 
          height: '100%', 
          width: '100%',
          position: 'relative',
          zIndex: 1
        }}
      ></div>
      
      {/* Leyenda */}
      <div className={style.leyenda}>
        <h4>Leyenda</h4>
        {vistaMapa === 'tiempo_real' && (
          <div>
            <div className={style.leyendaItem}>
              <div className={style.leyendaIcono} style={{ backgroundColor: '#10b981' }}></div>
              <span>En Curso</span>
            </div>
            <div className={style.leyendaItem}>
              <div className={style.leyendaIcono} style={{ backgroundColor: '#3b82f6' }}></div>
              <span>Asignado</span>
            </div>
            <div className={style.leyendaItem}>
              <div className={style.leyendaIcono} style={{ backgroundColor: '#ef4444' }}></div>
              <span>Urgente</span>
            </div>
          </div>
        )}
        
        {asignaciones && asignaciones.length > 0 && (
          <div className={style.leyendaItem}>
            <span>📊 Total: {asignaciones.length}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default MapaInteractivo;
 