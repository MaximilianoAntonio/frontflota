// src/components/dashboard/VistaMapa/index.js
import { h } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import MapaInteractivo from '../MapaInteractivo';
import FiltrosMapa from '../FiltrosMapa';
import PanelAsignaciones from '../PanelAsignaciones';
import style from './style.css';

const VistaMapa = ({ vehiculos = [], conductores = [], asignaciones = [], filtros = {}, onFiltrosChange = () => {} }) => {
    const [vistaActual, setVistaActual] = useState('tiempo_real');
    const [asignacionesEnriquecidas, setAsignacionesEnriquecidas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [asignacionSeleccionada, setAsignacionSeleccionada] = useState(null);
    const [panelFiltrosVisible, setPanelFiltrosVisible] = useState(false);
    const [panelAsignacionesVisible, setPanelAsignacionesVisible] = useState(false);

    // Simular coordenadas para las asignaciones (en un caso real vendrían del backend)
    const simularCoordenadas = (asignacion) => {
        // Coordenadas base de Valparaíso, Chile
        const baseLatValparaiso = -33.0472;
        const baseLngValparaiso = -71.6127;

        // Generar coordenadas aleatorias en un radio de ~20km
        const radioKm = 20;
        const radioDegrees = radioKm / 111; // Aproximadamente 1 grado = 111 km

        const randomLatActual = baseLatValparaiso + (Math.random() - 0.5) * radioDegrees;
        const randomLngActual = baseLngValparaiso + (Math.random() - 0.5) * radioDegrees;
        const randomLatInicio = baseLatValparaiso + (Math.random() - 0.5) * radioDegrees;
        const randomLngInicio = baseLngValparaiso + (Math.random() - 0.5) * radioDegrees;
        const randomLatFin = baseLatValparaiso + (Math.random() - 0.5) * radioDegrees;
        const randomLngFin = baseLngValparaiso + (Math.random() - 0.5) * radioDegrees;

        return {
            actual: { lat: randomLatActual, lng: randomLngActual },
            inicio: { lat: randomLatInicio, lng: randomLngInicio },
            fin: { lat: randomLatFin, lng: randomLngFin }
        };
    };

    // Enriquecer asignaciones con información adicional
    const enriquecerAsignaciones = async () => {
        setLoading(true);
        try {
            console.log('Asignaciones recibidas en VistaMapa (prop):', asignaciones);
            if (!asignaciones || asignaciones.length === 0) {
                setAsignacionesEnriquecidas([]);
                return;
            }
            
            const vehiculosArray = Array.isArray(vehiculos) ? vehiculos : [];
            const conductoresArray = Array.isArray(conductores) ? conductores : [];
            const asignacionesConDatos = asignaciones.map(asignacion => {
                const vehiculo = vehiculosArray.find(v => v.id === asignacion.vehiculo_id);
                const conductor = conductoresArray.find(c => c.id === asignacion.conductor_id);

                // Usar coordenadas reales si existen, si no simular
                let coordenadas;
                if (
                    asignacion.origen_lat != null && asignacion.origen_lon != null &&
                    asignacion.destino_lat != null && asignacion.destino_lon != null
                ) {
                    coordenadas = {
                        actual: { lat: asignacion.origen_lat, lng: asignacion.origen_lon },
                        inicio: { lat: asignacion.origen_lat, lng: asignacion.origen_lon },
                        fin: { lat: asignacion.destino_lat, lng: asignacion.destino_lon }
                    };
                } else {
                    coordenadas = simularCoordenadas(asignacion);
                }

                return {
                    ...asignacion,
                    vehiculo,
                    conductor,
                    coordenadas,
                    // Simular datos adicionales para el mapa
                    velocidadActual: asignacion.estado === 'en_curso' ? Math.floor(Math.random() * 60) + 20 : 0,
                    combustibleNivel: Math.floor(Math.random() * 100),
                    ultimaActualizacion: new Date().toISOString(),
                    distanciaRecorrida: Math.floor(Math.random() * 200) + 10
                };
            });

            setAsignacionesEnriquecidas(asignacionesConDatos);
        } catch (error) {
            console.error('Error enriqueciendo asignaciones:', error);
            setAsignacionesEnriquecidas([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (asignaciones && asignaciones.length > 0) {
            enriquecerAsignaciones();
        } else {
            setAsignacionesEnriquecidas([]);
            setLoading(false);
        }
    }, [asignaciones, vehiculos, conductores]);

    // Filtrar asignaciones según los filtros aplicados
    const asignacionesFiltradas = asignacionesEnriquecidas.filter(asignacion => {
    // Log para depuración
    console.log('Asignaciones filtradas para el mapa:', asignacionesEnriquecidas);
        // Filtrar solo si el filtro está activo y no es 'todos'
        if (filtros.estado && filtros.estado !== 'todas' && asignacion.estado !== filtros.estado) {
            return false;
        }
        if (filtros.conductor && filtros.conductor !== 'todos' && asignacion.conductor_id !== parseInt(filtros.conductor)) {
            return false;
        }
        if (filtros.tipoVehiculo && filtros.tipoVehiculo !== 'todos' && asignacion.vehiculo?.tipo !== filtros.tipoVehiculo) {
            return false;
        }
        // Filtros de fecha
        if (filtros.fechaInicio && new Date(asignacion.fecha_inicio) < new Date(filtros.fechaInicio)) {
            return false;
        }
        if (filtros.fechaFin && new Date(asignacion.fecha_inicio) > new Date(filtros.fechaFin)) {
            return false;
        }
        // Solo asignaciones con coordenadas válidas
        if (!asignacion.coordenadas || typeof asignacion.coordenadas.actual?.lat !== 'number' || typeof asignacion.coordenadas.actual?.lng !== 'number') {
            return false;
        }
        return true;
    // Log para depuración
    console.log('Asignaciones filtradas para el mapa:', asignacionesEnriquecidas);
    console.log('Asignaciones que pasan el filtro:', asignacionesFiltradas);
    });

    const cambiarVista = (nuevaVista) => {
        setVistaActual(nuevaVista);
        setAsignacionSeleccionada(null);
    };

    const seleccionarAsignacion = (asignacion) => {
        setAsignacionSeleccionada(asignacion);
    };

    const obtenerEstadisticasMapa = () => {
        return {
            total: asignacionesFiltradas.length,
            enCurso: asignacionesFiltradas.filter(a => a.estado === 'en_curso').length,
            pendientes: asignacionesFiltradas.filter(a => a.estado === 'asignada').length,
            completadas: asignacionesFiltradas.filter(a => a.estado === 'completada').length,
            urgentes: asignacionesFiltradas.filter(a => a.prioridad === 'alta').length,
            vehiculosActivos: new Set(asignacionesFiltradas.filter(a => a.estado === 'en_curso').map(a => a.vehiculo_id)).size,
            conductoresActivos: new Set(asignacionesFiltradas.filter(a => a.estado === 'en_curso').map(a => a.conductor_id)).size
        };
    };

    const estadisticas = obtenerEstadisticasMapa();

    const togglePanelFiltros = () => {
        setPanelFiltrosVisible(!panelFiltrosVisible);
        if (panelAsignacionesVisible) {
            setPanelAsignacionesVisible(false);
        }
    };

    const togglePanelAsignaciones = () => {
        setPanelAsignacionesVisible(!panelAsignacionesVisible);
        if (panelFiltrosVisible) {
            setPanelFiltrosVisible(false);
        }
    };

    if (loading) {
        return (
            <div className={style.loadingContainer}>
                <div className={style.loadingSpinner}></div>
                <p>Cargando mapa...</p>
            </div>
        );
    }

    return (
        <div className={style.vistaMapaContainer}>
            {/* Header con controles de vista */}
            <div className={style.headerMapa}>
                <div className={style.controlesVista}>
                    <button
                        className={`${style.botonVista} ${vistaActual === 'tiempo_real' ? style.activo : ''}`}
                        onClick={() => cambiarVista('tiempo_real')}
                    >
                        🔴 Tiempo Real
                    </button>
                    <button
                        className={`${style.botonVista} ${vistaActual === 'historico' ? style.activo : ''}`}
                        onClick={() => cambiarVista('historico')}
                    >
                        📊 Histórico
                    </button>
                    <button
                        className={`${style.botonVista} ${vistaActual === 'rutas' ? style.activo : ''}`}
                        onClick={() => cambiarVista('rutas')}
                    >
                        🗺️ Rutas
                    </button>
                </div>

                <div className={style.estadisticasHeader}>
                    <div className={style.statHeader}>
                        <span className={style.statNumero}>{estadisticas.total}</span>
                        <span className={style.statLabel}>Total</span>
                    </div>
                    <div className={style.statHeader}>
                        <span className={style.statNumero}>{estadisticas.enCurso}</span>
                        <span className={style.statLabel}>En Curso</span>
                    </div>
                    <div className={style.statHeader}>
                        <span className={style.statNumero}>{estadisticas.vehiculosActivos}</span>
                        <span className={style.statLabel}>Vehículos Activos</span>
                    </div>
                </div>

                <div className={style.controlesPaneles}>
                    <button
                        className={`${style.botonPanel} ${panelFiltrosVisible ? style.activo : ''}`}
                        onClick={togglePanelFiltros}
                        title="Filtros del mapa"
                    >
                        🔍 Filtros
                    </button>
                    <button
                        className={`${style.botonPanel} ${panelAsignacionesVisible ? style.activo : ''}`}
                        onClick={togglePanelAsignaciones}
                        title="Lista de asignaciones"
                    >
                        📋 Asignaciones ({asignacionesFiltradas.length})
                    </button>
                </div>
            </div>

            {/* Contenido principal del mapa */}
            <div className={style.contenidoMapa}>
                <MapaInteractivo
                    asignaciones={asignacionesFiltradas}
                    vehiculos={vehiculos}
                    conductores={conductores}
                    vistaMapa={vistaActual}
                    asignacionSeleccionada={asignacionSeleccionada}
                    onAsignacionSelect={seleccionarAsignacion}
                    filtros={filtros}
                />

                {/* Panel de filtros lateral */}
                {panelFiltrosVisible && (
                    <div className={style.panelLateralIzquierdo}>
                        <FiltrosMapa
                            filtros={filtros}
                            onChange={onFiltrosChange}
                            conductores={conductores}
                            vehiculos={vehiculos}
                            estadisticas={estadisticas}
                        />
                    </div>
                )}

                {/* Panel de asignaciones lateral */}
                {panelAsignacionesVisible && (
                    <div className={style.panelLateralDerecho}>
                        <PanelAsignaciones
                            asignaciones={asignacionesFiltradas}
                            asignacionSeleccionada={asignacionSeleccionada}
                            onAsignacionSelect={seleccionarAsignacion}
                            visible={panelAsignacionesVisible}
                            onClose={() => setPanelAsignacionesVisible(false)}
                        />
                    </div>
                )}

                {/* Panel de información flotante */}
                {asignacionSeleccionada && (
                    <div className={style.panelInfo}>
                        <div className={style.panelHeader}>
                            <h4>📍 Información de Asignación</h4>
                            <button
                                onClick={() => setAsignacionSeleccionada(null)}
                                className={style.cerrarPanel}
                            >
                                ✕
                            </button>
                        </div>
                        <div className={style.panelContent}>
                            <div className={style.infoItem}>
                                <strong>Descripción:</strong>
                                <span>{asignacionSeleccionada.descripcion}</span>
                            </div>
                            <div className={style.infoItem}>
                                <strong>Estado:</strong>
                                <span className={`${style.estadoBadge} ${style[asignacionSeleccionada.estado]}`}>
                                    {asignacionSeleccionada.estado}
                                </span>
                            </div>
                            <div className={style.infoItem}>
                                <strong>Vehículo:</strong>
                                <span>{asignacionSeleccionada.vehiculo?.patente || 'N/A'}</span>
                            </div>
                            <div className={style.infoItem}>
                                <strong>Conductor:</strong>
                                <span>
                                    {asignacionSeleccionada.conductor ? 
                                        `${asignacionSeleccionada.conductor.nombre} ${asignacionSeleccionada.conductor.apellido}` : 
                                        'N/A'
                                    }
                                </span>
                            </div>
                            {asignacionSeleccionada.estado === 'en_curso' && (
                                <>
                                    <div className={style.infoItem}>
                                        <strong>Velocidad:</strong>
                                        <span>{asignacionSeleccionada.velocidadActual} km/h</span>
                                    </div>
                                    <div className={style.infoItem}>
                                        <strong>Combustible:</strong>
                                        <span>{asignacionSeleccionada.combustibleNivel}%</span>
                                    </div>
                                    <div className={style.infoItem}>
                                        <strong>Distancia recorrida:</strong>
                                        <span>{asignacionSeleccionada.distanciaRecorrida} km</span>
                                    </div>
                                </>
                            )}
                            <div className={style.infoItem}>
                                <strong>Coordenadas:</strong>
                                <span>
                                    {asignacionSeleccionada.coordenadas?.actual?.lat !== undefined && asignacionSeleccionada.coordenadas?.actual?.lng !== undefined
                                        ? `${asignacionSeleccionada.coordenadas.actual.lat.toFixed(6)}, ${asignacionSeleccionada.coordenadas.actual.lng.toFixed(6)}`
                                        : 'N/A'}
                                </span>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default VistaMapa;