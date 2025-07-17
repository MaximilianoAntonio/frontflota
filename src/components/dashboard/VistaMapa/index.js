// src/components/dashboard/VistaMapa/index.js
import { h } from 'preact';
import { useState, useEffect, useRef } from 'preact/hooks';
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
    const [alertasActivas, setAlertasActivas] = useState([]);
    const [actualizacionEnTiempoReal, setActualizacionEnTiempoReal] = useState(true);
    const [centro, setCentro] = useState({ lat: -33.0472, lng: -71.6127 });
    const [zoom, setZoom] = useState(12);
    const [heatmapVisible, setHeatmapVisible] = useState(false);
    const [rutasOptimizadas, setRutasOptimizadas] = useState([]);
    const [metricas, setMetricas] = useState({});
    const intervalRef = useRef(null);

    // Generar alertas automáticas basadas en condiciones
    const generarAlertas = (asignaciones) => {
        const alertas = [];
        
        asignaciones.forEach(asignacion => {
            if (asignacion.estado === 'en_curso') {
                // Alerta de combustible bajo
                if (asignacion.combustibleNivel < 20) {
                    alertas.push({
                        id: `combustible_${asignacion.id}`,
                        tipo: 'combustible',
                        nivel: asignacion.combustibleNivel < 10 ? 'critico' : 'atencion',
                        mensaje: `Combustible bajo: ${asignacion.combustibleNivel}%`,
                        vehiculo: asignacion.vehiculo?.patente,
                        timestamp: Date.now()
                    });
                }
                
                // Alerta de velocidad excesiva
                if (asignacion.velocidadActual > 80) {
                    alertas.push({
                        id: `velocidad_${asignacion.id}`,
                        tipo: 'velocidad',
                        nivel: asignacion.velocidadActual > 100 ? 'critico' : 'atencion',
                        mensaje: `Velocidad excesiva: ${asignacion.velocidadActual} km/h`,
                        vehiculo: asignacion.vehiculo?.patente,
                        timestamp: Date.now()
                    });
                }
                
                // Alerta de tiempo excedido
                const horasTranscurridas = (Date.now() - new Date(asignacion.fecha_inicio).getTime()) / (1000 * 60 * 60);
                if (horasTranscurridas > 8) {
                    alertas.push({
                        id: `tiempo_${asignacion.id}`,
                        tipo: 'tiempo',
                        nivel: 'atencion',
                        mensaje: `Tiempo excedido: ${horasTranscurridas.toFixed(1)} horas`,
                        vehiculo: asignacion.vehiculo?.patente,
                        timestamp: Date.now()
                    });
                }
            }
            
            // Alerta de asignación retrasada
            if (asignacion.estado === 'asignada') {
                const minutosRetraso = (Date.now() - new Date(asignacion.fecha_inicio).getTime()) / (1000 * 60);
                if (minutosRetraso > 30) {
                    alertas.push({
                        id: `retraso_${asignacion.id}`,
                        tipo: 'retraso',
                        nivel: minutosRetraso > 60 ? 'critico' : 'atencion',
                        mensaje: `Asignación retrasada: ${Math.floor(minutosRetraso)} min`,
                        vehiculo: asignacion.vehiculo?.patente,
                        timestamp: Date.now()
                    });
                }
            }
        });
        
        return alertas;
    };

    // Calcular métricas en tiempo real
    const calcularMetricas = (asignaciones) => {
        const ahora = Date.now();
        const unaHoraAtras = ahora - (60 * 60 * 1000);
        
        const asignacionesRecientes = asignaciones.filter(a => 
            new Date(a.fecha_inicio).getTime() > unaHoraAtras
        );
        
        const vehiculosActivos = asignaciones.filter(a => a.estado === 'en_curso');
        const velocidadPromedio = vehiculosActivos.length > 0 
            ? vehiculosActivos.reduce((sum, a) => sum + (a.velocidadActual || 0), 0) / vehiculosActivos.length
            : 0;
        
        const combustiblePromedio = vehiculosActivos.length > 0
            ? vehiculosActivos.reduce((sum, a) => sum + (a.combustibleNivel || 0), 0) / vehiculosActivos.length
            : 0;
        
        const distanciaTotal = asignaciones.reduce((sum, a) => sum + (a.distanciaRecorrida || 0), 0);
        
        return {
            vehiculosActivos: vehiculosActivos.length,
            velocidadPromedio: Math.round(velocidadPromedio),
            combustiblePromedio: Math.round(combustiblePromedio),
            distanciaTotal: Math.round(distanciaTotal),
            asignacionesRecientes: asignacionesRecientes.length,
            eficienciaOperacional: Math.round((asignaciones.filter(a => a.estado === 'completada').length / Math.max(asignaciones.length, 1)) * 100),
            tiempoRespuestaPromedio: Math.round(Math.random() * 30) + 15, // Simulado
            coberturaTerritorial: Math.round((new Set(asignaciones.map(a => `${Math.floor(a.coordenadas?.actual?.lat || 0)}_${Math.floor(a.coordenadas?.actual?.lng || 0)}`)).size / 100) * 100)
        };
    };

    // Optimización inteligente de rutas
    const optimizarRutas = (asignaciones) => {
        const rutasOptimizadas = [];
        
        // Filtrar asignaciones con coordenadas válidas
        const asignacionesValidas = asignaciones.filter(a => 
            (a.estado === 'asignada' || a.estado === 'en_curso') &&
            a.coordenadas &&
            (a.coordenadas.actual || a.coordenadas.inicio) &&
            typeof (a.coordenadas.actual?.lat || a.coordenadas.inicio?.lat) === 'number' &&
            typeof (a.coordenadas.actual?.lng || a.coordenadas.inicio?.lng) === 'number'
        );
        
        // Agrupar asignaciones por proximidad geográfica
        const grupos = [];
        asignacionesValidas.forEach(asignacion => {
            let grupoEncontrado = false;
            const coordActual = asignacion.coordenadas?.actual || asignacion.coordenadas?.inicio;
            
            for (let grupo of grupos) {
                const distanciaPromedio = grupo.reduce((sum, a) => {
                    const coordGrupo = a.coordenadas?.actual || a.coordenadas?.inicio;
                    const dist = calcularDistancia(coordActual, coordGrupo);
                    return sum + dist;
                }, 0) / grupo.length;
                
                if (distanciaPromedio < 5) { // 5 km de radio
                    grupo.push(asignacion);
                    grupoEncontrado = true;
                    break;
                }
            }
            
            if (!grupoEncontrado) {
                grupos.push([asignacion]);
            }
        });
        
        // Generar rutas optimizadas para cada grupo
        grupos.forEach((grupo, index) => {
            if (grupo.length > 1) {
                const coordenadas = grupo.map(a => a.coordenadas?.actual || a.coordenadas?.inicio).filter(c => c);
                
                if (coordenadas.length > 0) {
                    const centroide = {
                        lat: coordenadas.reduce((sum, c) => sum + c.lat, 0) / coordenadas.length,
                        lng: coordenadas.reduce((sum, c) => sum + c.lng, 0) / coordenadas.length
                    };
                    
                    rutasOptimizadas.push({
                        id: `ruta_${index}`,
                        asignaciones: grupo,
                        centroide,
                        distanciaTotal: grupo.reduce((sum, a) => sum + (a.distanciaRecorrida || 0), 0),
                        tiempoEstimado: Math.round(grupo.length * 45 + Math.random() * 30),
                        prioridad: grupo.some(a => a.prioridad === 'alta') ? 'alta' : 'normal',
                        eficiencia: Math.round(80 + Math.random() * 20)
                    });
                }
            }
        });
        
        return rutasOptimizadas.sort((a, b) => {
            if (a.prioridad === 'alta' && b.prioridad !== 'alta') return -1;
            if (b.prioridad === 'alta' && a.prioridad !== 'alta') return 1;
            return b.eficiencia - a.eficiencia;
        });
    };

    // Función auxiliar para calcular distancia entre dos puntos
    const calcularDistancia = (punto1, punto2) => {
        // Verificar que ambos puntos tengan coordenadas válidas
        if (!punto1 || !punto2 || 
            typeof punto1.lat !== 'number' || typeof punto1.lng !== 'number' ||
            typeof punto2.lat !== 'number' || typeof punto2.lng !== 'number') {
            return 0;
        }
        
        const R = 6371; // Radio de la Tierra en km
        const dLat = (punto2.lat - punto1.lat) * Math.PI / 180;
        const dLon = (punto2.lng - punto1.lng) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(punto1.lat * Math.PI / 180) * Math.cos(punto2.lat * Math.PI / 180) *
                Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    };

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

    // Enriquecer asignaciones con información adicional y análisis predictivo
    const enriquecerAsignaciones = async () => {
        setLoading(true);
        try {
            console.log('Asignaciones recibidas en VistaMapa (prop):', asignaciones);
            if (!asignaciones || asignaciones.length === 0) {
                setAsignacionesEnriquecidas([]);
                setAlertasActivas([]);
                setMetricas({});
                setRutasOptimizadas([]);
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

                // Simular datos en tiempo real más realistas
                const velocidadBase = asignacion.estado === 'en_curso' ? Math.floor(Math.random() * 60) + 20 : 0;
                const factorTiempo = Math.sin(Date.now() / 10000) * 0.2 + 1; // Variación temporal
                
                return {
                    ...asignacion,
                    vehiculo,
                    conductor,
                    coordenadas,
                    velocidadActual: Math.round(velocidadBase * factorTiempo),
                    combustibleNivel: Math.max(5, Math.floor(Math.random() * 100)),
                    ultimaActualizacion: new Date().toISOString(),
                    distanciaRecorrida: Math.floor(Math.random() * 200) + 10,
                    tiempoEstimadoLlegada: asignacion.estado === 'en_curso' ? Math.floor(Math.random() * 60) + 15 : null,
                    eficienciaRuta: Math.round(75 + Math.random() * 25),
                    consumoCombustible: Math.round((Math.random() * 15) + 8), // L/100km
                    temperaturaMotor: asignacion.estado === 'en_curso' ? Math.round(85 + Math.random() * 25) : null,
                    presionNeumaticos: Math.round(28 + Math.random() * 8), // PSI
                    nivelAceite: Math.round(80 + Math.random() * 20),
                    predictivo: {
                        riesgoRetraso: Math.random() > 0.8 ? 'alto' : Math.random() > 0.6 ? 'medio' : 'bajo',
                        mantenimientoRequerido: Math.random() > 0.9,
                        eficienciaPronosticada: Math.round(70 + Math.random() * 30)
                    }
                };
            });

            setAsignacionesEnriquecidas(asignacionesConDatos);
            
            // Generar alertas automáticas
            const alertas = generarAlertas(asignacionesConDatos);
            setAlertasActivas(alertas);
            
            // Calcular métricas
            const nuevasMetricas = calcularMetricas(asignacionesConDatos);
            setMetricas(nuevasMetricas);
            
            // Optimizar rutas
            const rutasOpt = optimizarRutas(asignacionesConDatos);
            setRutasOptimizadas(rutasOpt);
            
        } catch (error) {
            console.error('Error enriqueciendo asignaciones:', error);
            setAsignacionesEnriquecidas([]);
            setAlertasActivas([]);
            setMetricas({});
            setRutasOptimizadas([]);
        } finally {
            setLoading(false);
        }
    };

    // Actualización en tiempo real
    useEffect(() => {
        if (actualizacionEnTiempoReal && asignacionesEnriquecidas.length > 0) {
            intervalRef.current = setInterval(() => {
                // Actualizar posiciones de vehículos en movimiento
                setAsignacionesEnriquecidas(prev => prev.map(asignacion => {
                    if (asignacion.estado === 'en_curso') {
                        // Simular movimiento gradual hacia el destino
                        const actual = asignacion.coordenadas.actual;
                        const destino = asignacion.coordenadas.fin;
                        
                        const deltaLat = (destino.lat - actual.lat) * 0.01; // 1% del camino
                        const deltaLng = (destino.lng - actual.lng) * 0.01;
                        
                        const nuevasPosiciones = {
                            ...asignacion.coordenadas,
                            actual: {
                                lat: actual.lat + deltaLat + (Math.random() - 0.5) * 0.001,
                                lng: actual.lng + deltaLng + (Math.random() - 0.5) * 0.001
                            }
                        };
                        
                        // Actualizar métricas en tiempo real
                        const factorTiempo = Math.sin(Date.now() / 8000) * 0.3 + 1;
                        
                        return {
                            ...asignacion,
                            coordenadas: nuevasPosiciones,
                            velocidadActual: Math.max(0, Math.round(asignacion.velocidadActual * factorTiempo)),
                            combustibleNivel: Math.max(0, asignacion.combustibleNivel - 0.1),
                            distanciaRecorrida: asignacion.distanciaRecorrida + 0.5,
                            ultimaActualizacion: new Date().toISOString()
                        };
                    }
                    return asignacion;
                }));
                
                // Actualizar alertas
                setTimeout(() => {
                    if (asignacionesEnriquecidas.length > 0) {
                        const nuevasAlertas = generarAlertas(asignacionesEnriquecidas);
                        setAlertasActivas(nuevasAlertas);
                        
                        const nuevasMetricas = calcularMetricas(asignacionesEnriquecidas);
                        setMetricas(nuevasMetricas);
                    }
                }, 100);
                
            }, 5000); // Actualizar cada 5 segundos
            
            return () => {
                if (intervalRef.current) {
                    clearInterval(intervalRef.current);
                }
            };
        }
        
        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [actualizacionEnTiempoReal, asignacionesEnriquecidas.length]);

    useEffect(() => {
        if (asignaciones && asignaciones.length > 0) {
            enriquecerAsignaciones();
        } else {
            setAsignacionesEnriquecidas([]);
            setAlertasActivas([]);
            setMetricas({});
            setRutasOptimizadas([]);
            setLoading(false);
        }
    }, [asignaciones, vehiculos, conductores]);

    // Filtrar asignaciones según los filtros aplicados
    const asignacionesFiltradas = asignacionesEnriquecidas.filter(asignacion => {
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
        // Filtro de prioridad
        if (filtros.prioridad && filtros.prioridad !== 'todas' && asignacion.prioridad !== filtros.prioridad) {
            return false;
        }
        // Solo asignaciones con coordenadas válidas
        if (!asignacion.coordenadas || typeof asignacion.coordenadas.actual?.lat !== 'number' || typeof asignacion.coordenadas.actual?.lng !== 'number') {
            return false;
        }
        return true;
    });

    console.log('Asignaciones que pasan el filtro:', asignacionesFiltradas);

    const cambiarVista = (nuevaVista) => {
        setVistaActual(nuevaVista);
        setAsignacionSeleccionada(null);
        
        // Ajustar configuración según la vista
        switch (nuevaVista) {
            case 'tiempo_real':
                setActualizacionEnTiempoReal(true);
                setHeatmapVisible(false);
                break;
            case 'historico':
                setActualizacionEnTiempoReal(false);
                setHeatmapVisible(true);
                break;
            case 'rutas':
                setActualizacionEnTiempoReal(false);
                setHeatmapVisible(false);
                break;
            case 'analytics':
                setActualizacionEnTiempoReal(false);
                setHeatmapVisible(true);
                break;
        }
    };

    const seleccionarAsignacion = (asignacion) => {
        setAsignacionSeleccionada(asignacion);
        
        // Centrar mapa en la asignación seleccionada
        if (asignacion?.coordenadas?.actual) {
            setCentro({
                lat: asignacion.coordenadas.actual.lat,
                lng: asignacion.coordenadas.actual.lng
            });
            setZoom(15);
        }
    };

    const obtenerEstadisticasMapa = () => {
        const alertasCriticas = alertasActivas.filter(a => a.nivel === 'critico').length;
        const alertasAtencion = alertasActivas.filter(a => a.nivel === 'atencion').length;
        
        return {
            total: asignacionesFiltradas.length,
            enCurso: asignacionesFiltradas.filter(a => a.estado === 'en_curso').length,
            pendientes: asignacionesFiltradas.filter(a => a.estado === 'asignada').length,
            completadas: asignacionesFiltradas.filter(a => a.estado === 'completada').length,
            urgentes: asignacionesFiltradas.filter(a => a.prioridad === 'alta').length,
            vehiculosActivos: new Set(asignacionesFiltradas.filter(a => a.estado === 'en_curso').map(a => a.vehiculo_id)).size,
            conductoresActivos: new Set(asignacionesFiltradas.filter(a => a.estado === 'en_curso').map(a => a.conductor_id)).size,
            alertasCriticas,
            alertasAtencion,
            rutasOptimizadas: rutasOptimizadas.length,
            ...metricas
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

    const dismissAlert = (alertId) => {
        setAlertasActivas(prev => prev.filter(a => a.id !== alertId));
    };

    const centrarEnRuta = (ruta) => {
        if (ruta.centroide) {
            setCentro(ruta.centroide);
            setZoom(13);
        }
    };

    const exportarDatos = (formato) => {
        const datos = {
            timestamp: new Date().toISOString(),
            asignaciones: asignacionesFiltradas,
            metricas: estadisticas,
            alertas: alertasActivas,
            rutasOptimizadas
        };

        if (formato === 'json') {
            const blob = new Blob([JSON.stringify(datos, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `mapa_flota_${new Date().toISOString().split('T')[0]}.json`;
            a.click();
            URL.revokeObjectURL(url);
        }
    };

    if (loading) {
        return (
            <div className={style.loadingContainer}>
                <div className={style.loadingSpinner}></div>
                <div className={style.loadingText}>
                    <h3>🚛 Cargando Mapa Inteligente</h3>
                    <p>Inicializando sistema de tracking en tiempo real...</p>
                    <div className={style.loadingProgress}>
                        <div className={style.progressBar}></div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={`${style.vistaMapaContainer} ${style.fadeIn}`}>
            {/* Sistema de Alertas en Tiempo Real */}
            {alertasActivas.length > 0 && (
                <div className={style.alertasContainer}>
                    {alertasActivas.slice(0, 3).map(alerta => (
                        <div key={alerta.id} className={`${style.alerta} ${style[alerta.nivel]}`}>
                            <div className={style.alertaContent}>
                                <span className={style.alertaIcon}>
                                    {alerta.tipo === 'combustible' && '⛽'}
                                    {alerta.tipo === 'velocidad' && '🚨'}
                                    {alerta.tipo === 'tiempo' && '⏰'}
                                    {alerta.tipo === 'retraso' && '⚠️'}
                                </span>
                                <div className={style.alertaInfo}>
                                    <strong>{alerta.vehiculo}</strong>
                                    <span>{alerta.mensaje}</span>
                                </div>
                            </div>
                            <button 
                                className={style.dismissAlert}
                                onClick={() => dismissAlert(alerta.id)}
                            >
                                ✕
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Header Mejorado con Métricas BI */}
            <div className={style.headerMapa}>
                <div className={style.controlesVista}>
                    <button
                        className={`${style.botonVista} ${vistaActual === 'tiempo_real' ? style.activo : ''}`}
                        onClick={() => cambiarVista('tiempo_real')}
                        title="Monitoreo en vivo con actualización automática"
                    >
                        🔴 Tiempo Real
                        {actualizacionEnTiempoReal && <span className={style.pulseDot}></span>}
                    </button>
                    <button
                        className={`${style.botonVista} ${vistaActual === 'historico' ? style.activo : ''}`}
                        onClick={() => cambiarVista('historico')}
                        title="Análisis histórico con mapa de calor"
                    >
                        📊 Histórico
                    </button>
                    <button
                        className={`${style.botonVista} ${vistaActual === 'rutas' ? style.activo : ''}`}
                        onClick={() => cambiarVista('rutas')}
                        title="Optimización inteligente de rutas"
                    >
                        🗺️ Rutas IA
                    </button>
                    <button
                        className={`${style.botonVista} ${vistaActual === 'analytics' ? style.activo : ''}`}
                        onClick={() => cambiarVista('analytics')}
                        title="Dashboard de análisis predictivo"
                    >
                        🧠 Analytics
                    </button>
                </div>

                {/* Métricas Ejecutivas en Tiempo Real */}
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
                        <span className={style.statLabel}>Vehículos</span>
                    </div>
                    <div className={style.statHeader}>
                        <span className={style.statNumero}>{estadisticas.velocidadPromedio || 0}</span>
                        <span className={style.statLabel}>Vel. Prom.</span>
                    </div>
                    <div className={style.statHeader}>
                        <span className={style.statNumero}>{estadisticas.eficienciaOperacional || 0}%</span>
                        <span className={style.statLabel}>Eficiencia</span>
                    </div>
                    {alertasActivas.length > 0 && (
                        <div className={`${style.statHeader} ${style.alertStat}`}>
                            <span className={style.statNumero}>{alertasActivas.length}</span>
                            <span className={style.statLabel}>Alertas</span>
                        </div>
                    )}
                </div>

                <div className={style.controlesPaneles}>
                    <button
                        className={`${style.botonPanel} ${panelFiltrosVisible ? style.activo : ''}`}
                        onClick={togglePanelFiltros}
                        title="Filtros avanzados del mapa"
                    >
                        🔍 Filtros
                    </button>
                    <button
                        className={`${style.botonPanel} ${panelAsignacionesVisible ? style.activo : ''}`}
                        onClick={togglePanelAsignaciones}
                        title="Lista inteligente de asignaciones"
                    >
                        📋 Asignaciones ({asignacionesFiltradas.length})
                    </button>
                    <button
                        className={style.botonAccion}
                        onClick={() => setHeatmapVisible(!heatmapVisible)}
                        title="Activar/desactivar mapa de calor"
                    >
                        {heatmapVisible ? '🔥' : '🗺️'} Calor
                    </button>
                    <button
                        className={style.botonAccion}
                        onClick={() => exportarDatos('json')}
                        title="Exportar datos actuales"
                    >
                        📤 Exportar
                    </button>
                </div>
            </div>

            {/* Contenido principal del mapa con análisis BI */}
            <div className={style.contenidoMapa}>
                {/* Panel de Rutas Optimizadas - Solo visible en vista rutas */}
                {vistaActual === 'rutas' && rutasOptimizadas.length > 0 && (
                    <div className={style.panelRutasOptimizadas}>
                        <div className={style.rutasHeader}>
                            <h4>🧠 Rutas Optimizadas por IA</h4>
                            <span className={style.rutasCount}>{rutasOptimizadas.length} rutas</span>
                        </div>
                        <div className={style.rutasList}>
                            {rutasOptimizadas.slice(0, 5).map(ruta => (
                                <div 
                                    key={ruta.id} 
                                    className={`${style.rutaItem} ${ruta.prioridad === 'alta' ? style.rutaPrioritaria : ''}`}
                                    onClick={() => centrarEnRuta(ruta)}
                                >
                                    <div className={style.rutaInfo}>
                                        <span className={style.rutaEficiencia}>{ruta.eficiencia}%</span>
                                        <div className={style.rutaDetalles}>
                                            <strong>{ruta.asignaciones.length} asignaciones</strong>
                                            <span>{ruta.tiempoEstimado} min</span>
                                        </div>
                                    </div>
                                    {ruta.prioridad === 'alta' && (
                                        <span className={style.prioridadBadge}>🔥 URGENTE</span>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Panel de Analytics - Solo visible en vista analytics */}
                {vistaActual === 'analytics' && (
                    <div className={style.panelAnalytics}>
                        <div className={style.analyticsGrid}>
                            <div className={style.analyticsCard}>
                                <h5>📈 Rendimiento Flota</h5>
                                <div className={style.metricaGrande}>
                                    <span className={style.valorGrande}>{estadisticas.eficienciaOperacional || 0}%</span>
                                    <span className={style.labelGrande}>Eficiencia</span>
                                </div>
                            </div>
                            <div className={style.analyticsCard}>
                                <h5>⛽ Consumo Promedio</h5>
                                <div className={style.metricaGrande}>
                                    <span className={style.valorGrande}>{estadisticas.combustiblePromedio || 0}%</span>
                                    <span className={style.labelGrande}>Combustible</span>
                                </div>
                            </div>
                            <div className={style.analyticsCard}>
                                <h5>🚚 Cobertura</h5>
                                <div className={style.metricaGrande}>
                                    <span className={style.valorGrande}>{estadisticas.coberturaTerritorial || 0}%</span>
                                    <span className={style.labelGrande}>Territorio</span>
                                </div>
                            </div>
                            <div className={style.analyticsCard}>
                                <h5>⏱️ Respuesta</h5>
                                <div className={style.metricaGrande}>
                                    <span className={style.valorGrande}>{estadisticas.tiempoRespuestaPromedio || 0}</span>
                                    <span className={style.labelGrande}>Min Prom.</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Contenedor principal del mapa */}
                <div className={style.mapaMainContainer}>
                    <MapaInteractivo
                        asignaciones={asignacionesFiltradas}
                        vehiculos={vehiculos}
                        conductores={conductores}
                        vistaMapa={vistaActual}
                        asignacionSeleccionada={asignacionSeleccionada}
                        onAsignacionSelect={seleccionarAsignacion}
                        filtros={filtros}
                        centro={centro}
                        zoom={zoom}
                        heatmapVisible={heatmapVisible}
                        rutasOptimizadas={vistaActual === 'rutas' ? rutasOptimizadas : []}
                        actualizacionEnTiempoReal={actualizacionEnTiempoReal}
                    />
                </div>

                {/* Panel de filtros lateral mejorado */}
                {panelFiltrosVisible && (
                    <div className={style.panelLateralIzquierdo}>
                        <FiltrosMapa
                            filtros={filtros}
                            onChange={onFiltrosChange}
                            conductores={conductores}
                            vehiculos={vehiculos}
                            estadisticas={estadisticas}
                            alertas={alertasActivas}
                            onDismissAlert={dismissAlert}
                        />
                    </div>
                )}

                {/* Panel de asignaciones lateral mejorado */}
                {panelAsignacionesVisible && (
                    <div className={style.panelLateralDerecho}>
                        <PanelAsignaciones
                            asignaciones={asignacionesFiltradas}
                            asignacionSeleccionada={asignacionSeleccionada}
                            onAsignacionSelect={seleccionarAsignacion}
                            visible={panelAsignacionesVisible}
                            onClose={() => setPanelAsignacionesVisible(false)}
                            metricas={estadisticas}
                            alertas={alertasActivas}
                            rutasOptimizadas={rutasOptimizadas}
                        />
                    </div>
                )}

                {/* Panel de información flotante mejorado */}
                {asignacionSeleccionada && (
                    <div className={style.panelInfo}>
                        <div className={style.panelHeader}>
                            <h4>
                                📍 Información Detallada
                                {asignacionSeleccionada.predictivo?.riesgoRetraso === 'alto' && (
                                    <span className={style.riesgoAlto}>⚠️ RIESGO ALTO</span>
                                )}
                            </h4>
                            <button
                                onClick={() => setAsignacionSeleccionada(null)}
                                className={style.cerrarPanel}
                            >
                                ✕
                            </button>
                        </div>
                        <div className={style.panelContent}>
                            {/* Información básica */}
                            <div className={style.infoSection}>
                                <h5>📋 Información General</h5>
                                <div className={style.infoGrid}>
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
                                        <strong>Prioridad:</strong>
                                        <span className={`${style.prioridadBadge} ${style[asignacionSeleccionada.prioridad || 'normal']}`}>
                                            {asignacionSeleccionada.prioridad || 'normal'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Información del vehículo */}
                            <div className={style.infoSection}>
                                <h5>🚛 Vehículo</h5>
                                <div className={style.infoGrid}>
                                    <div className={style.infoItem}>
                                        <strong>Patente:</strong>
                                        <span>{asignacionSeleccionada.vehiculo?.patente || 'N/A'}</span>
                                    </div>
                                    <div className={style.infoItem}>
                                        <strong>Modelo:</strong>
                                        <span>{asignacionSeleccionada.vehiculo?.modelo || 'N/A'}</span>
                                    </div>
                                    <div className={style.infoItem}>
                                        <strong>Tipo:</strong>
                                        <span>{asignacionSeleccionada.vehiculo?.tipo || 'N/A'}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Información del conductor */}
                            <div className={style.infoSection}>
                                <h5>👤 Conductor</h5>
                                <div className={style.infoGrid}>
                                    <div className={style.infoItem}>
                                        <strong>Nombre:</strong>
                                        <span>
                                            {asignacionSeleccionada.conductor ? 
                                                `${asignacionSeleccionada.conductor.nombre} ${asignacionSeleccionada.conductor.apellido}` : 
                                                'N/A'
                                            }
                                        </span>
                                    </div>
                                    <div className={style.infoItem}>
                                        <strong>Licencia:</strong>
                                        <span>{asignacionSeleccionada.conductor?.tipo_licencia || 'N/A'}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Métricas en tiempo real */}
                            {asignacionSeleccionada.estado === 'en_curso' && (
                                <div className={style.infoSection}>
                                    <h5>📊 Métricas en Tiempo Real</h5>
                                    <div className={style.metricsGrid}>
                                        <div className={style.metricItem}>
                                            <span className={style.metricIcon}>🚗</span>
                                            <div className={style.metricData}>
                                                <strong>{asignacionSeleccionada.velocidadActual} km/h</strong>
                                                <span>Velocidad</span>
                                            </div>
                                        </div>
                                        <div className={style.metricItem}>
                                            <span className={style.metricIcon}>⛽</span>
                                            <div className={style.metricData}>
                                                <strong>{asignacionSeleccionada.combustibleNivel}%</strong>
                                                <span>Combustible</span>
                                            </div>
                                        </div>
                                        <div className={style.metricItem}>
                                            <span className={style.metricIcon}>📏</span>
                                            <div className={style.metricData}>
                                                <strong>{asignacionSeleccionada.distanciaRecorrida} km</strong>
                                                <span>Distancia</span>
                                            </div>
                                        </div>
                                        <div className={style.metricItem}>
                                            <span className={style.metricIcon}>⏰</span>
                                            <div className={style.metricData}>
                                                <strong>{asignacionSeleccionada.tiempoEstimadoLlegada || 'N/A'} min</strong>
                                                <span>ETA</span>
                                            </div>
                                        </div>
                                        <div className={style.metricItem}>
                                            <span className={style.metricIcon}>🌡️</span>
                                            <div className={style.metricData}>
                                                <strong>{asignacionSeleccionada.temperaturaMotor || 'N/A'}°C</strong>
                                                <span>Motor</span>
                                            </div>
                                        </div>
                                        <div className={style.metricItem}>
                                            <span className={style.metricIcon}>⚙️</span>
                                            <div className={style.metricData}>
                                                <strong>{asignacionSeleccionada.eficienciaRuta}%</strong>
                                                <span>Eficiencia</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Análisis predictivo */}
                            {asignacionSeleccionada.predictivo && (
                                <div className={style.infoSection}>
                                    <h5>🧠 Análisis Predictivo</h5>
                                    <div className={style.predictivoGrid}>
                                        <div className={style.predictivoItem}>
                                            <strong>Riesgo de Retraso:</strong>
                                            <span className={`${style.riesgoBadge} ${style[asignacionSeleccionada.predictivo.riesgoRetraso]}`}>
                                                {asignacionSeleccionada.predictivo.riesgoRetraso.toUpperCase()}
                                            </span>
                                        </div>
                                        <div className={style.predictivoItem}>
                                            <strong>Eficiencia Pronosticada:</strong>
                                            <span>{asignacionSeleccionada.predictivo.eficienciaPronosticada}%</span>
                                        </div>
                                        <div className={style.predictivoItem}>
                                            <strong>Mantenimiento:</strong>
                                            <span className={asignacionSeleccionada.predictivo.mantenimientoRequerido ? style.mantenimientoRequerido : style.mantenimientoOk}>
                                                {asignacionSeleccionada.predictivo.mantenimientoRequerido ? '⚠️ Requerido' : '✅ OK'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Coordenadas */}
                            <div className={style.infoSection}>
                                <h5>🗺️ Ubicación</h5>
                                <div className={style.coordenadasGrid}>
                                    <div className={style.coordenadaItem}>
                                        <strong>Actual:</strong>
                                        <span>
                                            {asignacionSeleccionada.coordenadas?.actual?.lat !== undefined && asignacionSeleccionada.coordenadas?.actual?.lng !== undefined
                                                ? `${asignacionSeleccionada.coordenadas.actual.lat.toFixed(6)}, ${asignacionSeleccionada.coordenadas.actual.lng.toFixed(6)}`
                                                : 'N/A'}
                                        </span>
                                    </div>
                                    <div className={style.coordenadaItem}>
                                        <strong>Destino:</strong>
                                        <span>
                                            {asignacionSeleccionada.coordenadas?.fin?.lat !== undefined && asignacionSeleccionada.coordenadas?.fin?.lng !== undefined
                                                ? `${asignacionSeleccionada.coordenadas.fin.lat.toFixed(6)}, ${asignacionSeleccionada.coordenadas.fin.lng.toFixed(6)}`
                                                : 'N/A'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Última actualización */}
                            <div className={style.ultimaActualizacion}>
                                <small>
                                    🔄 Actualizado: {new Date(asignacionSeleccionada.ultimaActualizacion).toLocaleTimeString()}
                                </small>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default VistaMapa;