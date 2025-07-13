// src/components/dashboard/VistaConductores/index.js
import { h } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import { getConductores } from '../../../services/conductorService';
import { getAsignaciones } from '../../../services/asignacionService';
import TablaConductores from '../TablaConductores';
import FiltrosConductores from '../FiltrosConductores';
import GraficosConductores from '../GraficosConductores';
import style from './style.css';

const VistaConductores = ({ data, loading, filtro }) => {
    const [conductores, setConductores] = useState([]);
    const [asignaciones, setAsignaciones] = useState([]);
    const [conductoresEnriquecidos, setConductoresEnriquecidos] = useState([]);
    const [loadingData, setLoadingData] = useState(true);
    const [filtros, setFiltros] = useState({
        busqueda: '',
        estado: 'todos',
        disponibilidad: 'todos'
    });
    const [conductorSeleccionado, setConductorSeleccionado] = useState(null);

    // Cargar datos iniciales
    useEffect(() => {
        const cargarDatos = async () => {
            try {
                setLoadingData(true);
                const [conductoresData, asignacionesData] = await Promise.all([
                    getConductores(),
                    getAsignaciones()
                ]);
                
                setConductores(conductoresData);
                setAsignaciones(asignacionesData);
            } catch (error) {
                console.error('Error cargando datos de conductores:', error);
            } finally {
                setLoadingData(false);
            }
        };

        cargarDatos();
    }, []);

    // Enriquecer datos de conductores con información adicional
    useEffect(() => {
        const enriquecerConductores = async () => {
            if (conductores.length === 0) return;

            const conductoresConDatos = await Promise.all(
                conductores.map(async (conductor) => {
                    // Calcular asignaciones del conductor
                    const asignacionesConductor = asignaciones.filter(a => 
                        a.conductor && a.conductor.id === conductor.id
                    );
                    
                    const asignacionesCompletadas = asignacionesConductor.filter(a => 
                        a.estado === 'completada'
                    );

                    // Calcular período de análisis (últimos 30 días)
                    const fechaInicio = new Date();
                    fechaInicio.setDate(fechaInicio.getDate() - 30);
                    
                    const asignacionesPeriodo = asignacionesConductor.filter(a => 
                        new Date(a.fecha_hora_requerida_inicio) >= fechaInicio
                    );

                    const asignacionesCompletadasPeriodo = asignacionesPeriodo.filter(a => 
                        a.estado === 'completada'
                    );

                    // Calcular días trabajados
                    const diasTrabajados = new Set(
                        asignacionesPeriodo.map(a => 
                            new Date(a.fecha_hora_requerida_inicio).toDateString()
                        )
                    ).size;

                    // Calcular tiempo promedio en asignaciones
                    const tiemposAsignacion = asignacionesCompletadasPeriodo
                        .filter(a => a.fecha_hora_fin_prevista && a.fecha_hora_requerida_inicio)
                        .map(a => {
                            const inicio = new Date(a.fecha_hora_requerida_inicio);
                            const fin = new Date(a.fecha_hora_fin_prevista);
                            return (fin - inicio) / (1000 * 60 * 60); // Horas
                        });

                    const tiempoPromedioHoras = tiemposAsignacion.length > 0
                        ? tiemposAsignacion.reduce((sum, t) => sum + t, 0) / tiemposAsignacion.length
                        : 0;

                    // Calcular kilómetros recorridos
                    const kmRecorridos = asignacionesCompletadasPeriodo.reduce(
                        (total, a) => total + (a.distancia_recorrida_km || 0), 0
                    );

                    // Calcular tasa de eficiencia
                    const tasaEficiencia = asignacionesPeriodo.length > 0
                        ? (asignacionesCompletadasPeriodo.length / asignacionesPeriodo.length) * 100
                        : 0;

                    // Verificar estado de licencia
                    const fechaVencimiento = new Date(conductor.fecha_vencimiento_licencia);
                    const diasParaVencimiento = Math.ceil((fechaVencimiento - new Date()) / (1000 * 60 * 60 * 24));
                    
                    let estadoLicencia = 'vigente';
                    if (diasParaVencimiento < 0) {
                        estadoLicencia = 'vencida';
                    } else if (diasParaVencimiento <= 30) {
                        estadoLicencia = 'por_vencer';
                    }

                    return {
                        ...conductor,
                        // Datos de actividad
                        totalAsignaciones: asignacionesConductor.length,
                        asignacionesCompletadas: asignacionesCompletadas.length,
                        asignacionesPeriodo30: asignacionesPeriodo.length,
                        asignacionesCompletadasPeriodo30: asignacionesCompletadasPeriodo.length,
                        diasTrabajados30: diasTrabajados,
                        diasLibres30: 30 - diasTrabajados,
                        
                        // Métricas de rendimiento
                        tiempoPromedioAsignacion: parseFloat(tiempoPromedioHoras.toFixed(2)),
                        kmRecorridos30: parseFloat(kmRecorridos.toFixed(2)),
                        tasaEficiencia: parseFloat(tasaEficiencia.toFixed(1)),
                        
                        // Estado de licencia
                        diasParaVencimientoLicencia: diasParaVencimiento,
                        estadoLicencia: estadoLicencia,
                        
                        // Disponibilidad calculada
                        disponibilidadPorcentaje: Math.min(100, (diasTrabajados / 30) * 100)
                    };
                })
            );

            setConductoresEnriquecidos(conductoresConDatos);
        };

        enriquecerConductores();
    }, [conductores, asignaciones]);

    // Filtrar conductores según criterios
    const conductoresFiltrados = conductoresEnriquecidos.filter(conductor => {
        const coincideBusqueda = !filtros.busqueda || 
            conductor.nombre.toLowerCase().includes(filtros.busqueda.toLowerCase()) ||
            conductor.apellido.toLowerCase().includes(filtros.busqueda.toLowerCase()) ||
            conductor.run?.toLowerCase().includes(filtros.busqueda.toLowerCase()) ||
            conductor.numero_licencia.toLowerCase().includes(filtros.busqueda.toLowerCase());

        const coincideEstado = filtros.estado === 'todos' || conductor.estado_disponibilidad === filtros.estado;
        
        const coincideDisponibilidad = filtros.disponibilidad === 'todos' || (() => {
            switch (filtros.disponibilidad) {
                case 'alta':
                    return conductor.disponibilidadPorcentaje >= 75;
                case 'media':
                    return conductor.disponibilidadPorcentaje >= 50 && conductor.disponibilidadPorcentaje < 75;
                case 'baja':
                    return conductor.disponibilidadPorcentaje < 50;
                default:
                    return true;
            }
        })();

        return coincideBusqueda && coincideEstado && coincideDisponibilidad;
    });

    const handleFiltroChange = (nuevosFiltros) => {
        setFiltros({ ...filtros, ...nuevosFiltros });
    };

    const handleVerDetalles = (conductor) => {
        setConductorSeleccionado(conductor);
    };

    if (loading || loadingData) {
        return (
            <div className={style.loadingContainer}>
                <div className={style.spinner}></div>
                <p>Cargando datos de conductores...</p>
            </div>
        );
    }

    return (
        <div className={style.vistaConductores}>
            {/* Header con métricas rápidas */}
            <div className={style.metricsHeader}>
                <div className={style.metricQuick}>
                    <span className={style.metricValue}>{conductoresEnriquecidos.length}</span>
                    <span className={style.metricLabel}>Conductores Total</span>
                </div>
                <div className={style.metricQuick}>
                    <span className={style.metricValue}>
                        {conductoresEnriquecidos.filter(c => c.estado_disponibilidad === 'disponible').length}
                    </span>
                    <span className={style.metricLabel}>Disponibles</span>
                </div>
                <div className={style.metricQuick}>
                    <span className={style.metricValue}>
                        {conductoresEnriquecidos.filter(c => c.estadoLicencia === 'por_vencer' || c.estadoLicencia === 'vencida').length}
                    </span>
                    <span className={style.metricLabel}>Licencias por Vencer</span>
                </div>
                <div className={style.metricQuick}>
                    <span className={style.metricValue}>
                        {conductoresEnriquecidos.filter(c => c.estado_disponibilidad === 'en_ruta').length}
                    </span>
                    <span className={style.metricLabel}>En Ruta</span>
                </div>
            </div>

            {/* Gráficos de análisis */}
            <GraficosConductores conductores={conductoresEnriquecidos} />

            {/* Filtros */}
            <FiltrosConductores 
                filtros={filtros}
                onChange={handleFiltroChange}
                conductores={conductoresEnriquecidos}
            />

            {/* Tabla de conductores */}
            <TablaConductores 
                conductores={conductoresFiltrados}
                onVerDetalles={handleVerDetalles}
            />

            {/* Modal de detalles */}
            {conductorSeleccionado && (
                <div className={style.modalOverlay} onClick={() => setConductorSeleccionado(null)}>
                    <div className={style.modalContent} onClick={e => e.stopPropagation()}>
                        <div className={style.modalHeader}>
                            <h3>
                                {conductorSeleccionado.nombre} {conductorSeleccionado.apellido}
                                <span className={style.run}>
                                    RUN: {conductorSeleccionado.run || 'No especificado'}
                                </span>
                            </h3>
                            <button 
                                onClick={() => setConductorSeleccionado(null)}
                                className={style.closeButton}
                            >
                                ✕
                            </button>
                        </div>

                        <div className={style.modalBody}>
                            {/* Información personal */}
                            <div className={style.infoSection}>
                                <h4>Información Personal</h4>
                                <div className={style.infoGrid}>
                                    <div className={style.infoItem}>
                                        <span className={style.infoLabel}>RUN:</span>
                                        <span className={style.infoValue}>
                                            {conductorSeleccionado.run || 'No especificado'}
                                        </span>
                                    </div>
                                    <div className={style.infoItem}>
                                        <span className={style.infoLabel}>Teléfono:</span>
                                        <span className={style.infoValue}>
                                            {conductorSeleccionado.telefono || 'No especificado'}
                                        </span>
                                    </div>
                                    <div className={style.infoItem}>
                                        <span className={style.infoLabel}>Email:</span>
                                        <span className={style.infoValue}>
                                            {conductorSeleccionado.email || 'No especificado'}
                                        </span>
                                    </div>
                                    <div className={style.infoItem}>
                                        <span className={style.infoLabel}>Estado:</span>
                                        <span className={`${style.infoValue} ${style[conductorSeleccionado.estado_disponibilidad]}`}>
                                            {conductorSeleccionado.estado_disponibilidad}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Información de licencia */}
                            <div className={style.infoSection}>
                                <h4>Información de Licencia</h4>
                                <div className={style.infoGrid}>
                                    <div className={style.infoItem}>
                                        <span className={style.infoLabel}>Número de licencia:</span>
                                        <span className={style.infoValue}>
                                            {conductorSeleccionado.numero_licencia}
                                        </span>
                                    </div>
                                    <div className={style.infoItem}>
                                        <span className={style.infoLabel}>Fecha de vencimiento:</span>
                                        <span className={`${style.infoValue} ${style[conductorSeleccionado.estadoLicencia]}`}>
                                            {new Date(conductorSeleccionado.fecha_vencimiento_licencia).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <div className={style.infoItem}>
                                        <span className={style.infoLabel}>Días para vencimiento:</span>
                                        <span className={`${style.infoValue} ${style[conductorSeleccionado.estadoLicencia]}`}>
                                            {conductorSeleccionado.diasParaVencimientoLicencia > 0 
                                                ? `${conductorSeleccionado.diasParaVencimientoLicencia} días`
                                                : 'Vencida'
                                            }
                                        </span>
                                    </div>
                                    <div className={style.infoItem}>
                                        <span className={style.infoLabel}>Tipos habilitados:</span>
                                        <span className={style.infoValue}>
                                            {conductorSeleccionado.tipos_vehiculo_habilitados || 'No especificado'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Estadísticas de actividad */}
                            <div className={style.infoSection}>
                                <h4>Actividad (últimos 30 días)</h4>
                                <div className={style.statsGrid}>
                                    <div className={style.statCard}>
                                        <div className={style.statValue}>{conductorSeleccionado.diasTrabajados30}</div>
                                        <div className={style.statLabel}>Días trabajados</div>
                                    </div>
                                    <div className={style.statCard}>
                                        <div className={style.statValue}>{conductorSeleccionado.diasLibres30}</div>
                                        <div className={style.statLabel}>Días libres</div>
                                    </div>
                                    <div className={style.statCard}>
                                        <div className={style.statValue}>{conductorSeleccionado.asignacionesCompletadasPeriodo30}</div>
                                        <div className={style.statLabel}>Asignaciones completadas</div>
                                    </div>
                                    <div className={style.statCard}>
                                        <div className={style.statValue}>{conductorSeleccionado.tasaEficiencia}%</div>
                                        <div className={style.statLabel}>Tasa de eficiencia</div>
                                    </div>
                                    <div className={style.statCard}>
                                        <div className={style.statValue}>{conductorSeleccionado.tiempoPromedioAsignacion}h</div>
                                        <div className={style.statLabel}>Tiempo promedio</div>
                                    </div>
                                    <div className={style.statCard}>
                                        <div className={style.statValue}>{conductorSeleccionado.kmRecorridos30} km</div>
                                        <div className={style.statLabel}>Kilómetros recorridos</div>
                                    </div>
                                </div>
                            </div>

                            {/* Barra de disponibilidad */}
                            <div className={style.infoSection}>
                                <h4>Disponibilidad</h4>
                                <div className={style.progressContainer}>
                                    <div className={style.progressBar}>
                                        <div 
                                            className={style.progressFill}
                                            style={{ width: `${conductorSeleccionado.disponibilidadPorcentaje}%` }}
                                        ></div>
                                    </div>
                                    <span className={style.progressText}>
                                        {conductorSeleccionado.disponibilidadPorcentaje.toFixed(1)}% de disponibilidad
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default VistaConductores;
