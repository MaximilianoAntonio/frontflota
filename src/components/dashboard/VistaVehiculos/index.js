// src/components/dashboard/VistaVehiculos/index.js
import { h } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import { getVehiculos } from '../../../services/vehicleService';
import { getAsignaciones } from '../../../services/asignacionService';
import { getMantenimientoHistorial } from '../../../services/dashboardService';
import TablaVehiculos from '../TablaVehiculos';
import FiltrosVehiculos from '../FiltrosVehiculos';
import GraficosVehiculos from '../GraficosVehiculos';
import style from './style.css';

const VistaVehiculos = ({ data, loading, filtro }) => {
    const [vehiculos, setVehiculos] = useState([]);
    const [asignaciones, setAsignaciones] = useState([]);
    const [vehiculosEnriquecidos, setVehiculosEnriquecidos] = useState([]);
    const [loadingData, setLoadingData] = useState(true);
    const [filtros, setFiltros] = useState({
        busqueda: '',
        estado: 'todos',
        tipoVehiculo: 'todos',
        mantenimiento: 'todos'
    });
    const [vehiculoSeleccionado, setVehiculoSeleccionado] = useState(null);

    // Cargar datos iniciales
    useEffect(() => {
        const cargarDatos = async () => {
            try {
                setLoadingData(true);
                const [vehiculosData, asignacionesData] = await Promise.all([
                    getVehiculos(),
                    getAsignaciones()
                ]);
                
                setVehiculos(vehiculosData);
                setAsignaciones(asignacionesData);
            } catch (error) {
                console.error('Error cargando datos de vehículos:', error);
            } finally {
                setLoadingData(false);
            }
        };

        cargarDatos();
    }, []);

    // Enriquecer datos de vehículos con información adicional
    useEffect(() => {
        const enriquecerVehiculos = async () => {
            if (vehiculos.length === 0) return;

            const vehiculosConDatos = await Promise.all(
                vehiculos.map(async (vehiculo) => {
                    // Calcular días de uso y asignaciones
                    const asignacionesVehiculo = asignaciones.filter(a => 
                        a.vehiculo && a.vehiculo.id === vehiculo.id
                    );
                    
                    const asignacionesCompletadas = asignacionesVehiculo.filter(a => 
                        a.estado === 'completada'
                    );

                    // Calcular kilometraje para mantenimiento
                    const kmMantenimiento = vehiculo.kilometraje || 0;
                    const proximoMantenimiento = Math.ceil(kmMantenimiento / 10000) * 10000;
                    const kmParaMantenimiento = proximoMantenimiento - kmMantenimiento;
                    const porcentajeMantenimiento = Math.min(100, (kmMantenimiento % 10000) / 100);

                    // Determinar estado de mantenimiento
                    let estadoMantenimiento = 'bueno';
                    if (kmParaMantenimiento < 500) {
                        estadoMantenimiento = 'critico';
                    } else if (kmParaMantenimiento < 1500) {
                        estadoMantenimiento = 'atencion';
                    }

                    // Calcular uso en el período
                    const fechaInicio = new Date();
                    fechaInicio.setDate(fechaInicio.getDate() - 30); // Últimos 30 días
                    
                    const asignacionesPeriodo = asignacionesVehiculo.filter(a => 
                        new Date(a.fecha_hora_requerida_inicio) >= fechaInicio
                    );

                    const diasUsados = new Set(
                        asignacionesPeriodo.map(a => 
                            new Date(a.fecha_hora_requerida_inicio).toDateString()
                        )
                    ).size;

                    const kmRecorridos = asignacionesCompletadas.reduce(
                        (total, a) => total + (a.distancia_recorrida_km || 0), 0
                    );

                    return {
                        ...vehiculo,
                        // Datos de uso
                        totalAsignaciones: asignacionesVehiculo.length,
                        asignacionesCompletadas: asignacionesCompletadas.length,
                        kmRecorridos: parseFloat(kmRecorridos.toFixed(2)),
                        diasUsados30: diasUsados,
                        
                        // Datos de mantenimiento
                        proximoMantenimientoKm: proximoMantenimiento,
                        kmParaMantenimiento: kmParaMantenimiento,
                        porcentajeMantenimiento: parseFloat(porcentajeMantenimiento.toFixed(1)),
                        estadoMantenimiento: estadoMantenimiento,
                        
                        // Utilización
                        utilizacion: Math.min(100, (diasUsados / 30) * 100)
                    };
                })
            );

            setVehiculosEnriquecidos(vehiculosConDatos);
        };

        enriquecerVehiculos();
    }, [vehiculos, asignaciones]);

    // Filtrar vehículos según criterios
    const vehiculosFiltrados = vehiculosEnriquecidos.filter(vehiculo => {
        const coincideBusqueda = !filtros.busqueda || 
            vehiculo.patente.toLowerCase().includes(filtros.busqueda.toLowerCase()) ||
            vehiculo.marca.toLowerCase().includes(filtros.busqueda.toLowerCase()) ||
            vehiculo.modelo.toLowerCase().includes(filtros.busqueda.toLowerCase());

        const coincideEstado = filtros.estado === 'todos' || vehiculo.estado === filtros.estado;
        
        const coincideTipo = filtros.tipoVehiculo === 'todos' || vehiculo.tipo_vehiculo === filtros.tipoVehiculo;
        
        const coincideMantenimiento = filtros.mantenimiento === 'todos' || 
            vehiculo.estadoMantenimiento === filtros.mantenimiento;

        return coincideBusqueda && coincideEstado && coincideTipo && coincideMantenimiento;
    });

    const handleFiltroChange = (nuevosFiltros) => {
        setFiltros({ ...filtros, ...nuevosFiltros });
    };

    const handleVerDetalles = async (vehiculo) => {
        try {
            const historial = await getMantenimientoHistorial(vehiculo.id);
            setVehiculoSeleccionado({ ...vehiculo, historialMantenimiento: historial });
        } catch (error) {
            console.error('Error cargando historial de mantenimiento:', error);
            setVehiculoSeleccionado({ ...vehiculo, historialMantenimiento: [] });
        }
    };

    if (loading || loadingData) {
        return (
            <div className={style.loadingContainer}>
                <div className={style.spinner}></div>
                <p>Cargando datos de vehículos...</p>
            </div>
        );
    }

    return (
        <div className={style.vistaVehiculos}>
            {/* Header con métricas rápidas */}
            <div className={style.metricsHeader}>
                <div className={style.metricQuick}>
                    <span className={style.metricValue}>{vehiculosEnriquecidos.length}</span>
                    <span className={style.metricLabel}>Vehículos Total</span>
                </div>
                <div className={style.metricQuick}>
                    <span className={style.metricValue}>
                        {vehiculosEnriquecidos.filter(v => v.estado === 'disponible').length}
                    </span>
                    <span className={style.metricLabel}>Disponibles</span>
                </div>
                <div className={style.metricQuick}>
                    <span className={style.metricValue}>
                        {vehiculosEnriquecidos.filter(v => v.estadoMantenimiento === 'critico').length}
                    </span>
                    <span className={style.metricLabel}>Mant. Crítico</span>
                </div>
                <div className={style.metricQuick}>
                    <span className={style.metricValue}>
                        {vehiculosEnriquecidos.filter(v => v.estado === 'en_uso').length}
                    </span>
                    <span className={style.metricLabel}>En Uso</span>
                </div>
            </div>

            {/* Gráficos de análisis */}
            <GraficosVehiculos vehiculos={vehiculosEnriquecidos} />

            {/* Filtros */}
            <FiltrosVehiculos 
                filtros={filtros}
                onChange={handleFiltroChange}
                vehiculos={vehiculosEnriquecidos}
            />

            {/* Tabla de vehículos */}
            <TablaVehiculos 
                vehiculos={vehiculosFiltrados}
                onVerDetalles={handleVerDetalles}
            />

            {/* Modal de detalles */}
            {vehiculoSeleccionado && (
                <div className={style.modalOverlay} onClick={() => setVehiculoSeleccionado(null)}>
                    <div className={style.modalContent} onClick={e => e.stopPropagation()}>
                        <div className={style.modalHeader}>
                            <h3>
                                {vehiculoSeleccionado.marca} {vehiculoSeleccionado.modelo}
                                <span className={style.patente}>({vehiculoSeleccionado.patente})</span>
                            </h3>
                            <button 
                                onClick={() => setVehiculoSeleccionado(null)}
                                className={style.closeButton}
                            >
                                ✕
                            </button>
                        </div>

                        <div className={style.modalBody}>
                            {/* Información general */}
                            <div className={style.infoGrid}>
                                <div className={style.infoItem}>
                                    <span className={style.infoLabel}>Estado:</span>
                                    <span className={`${style.infoValue} ${style[vehiculoSeleccionado.estado]}`}>
                                        {vehiculoSeleccionado.estado}
                                    </span>
                                </div>
                                <div className={style.infoItem}>
                                    <span className={style.infoLabel}>Kilometraje:</span>
                                    <span className={style.infoValue}>
                                        {vehiculoSeleccionado.kilometraje?.toLocaleString()} km
                                    </span>
                                </div>
                                <div className={style.infoItem}>
                                    <span className={style.infoLabel}>Próximo mantenimiento:</span>
                                    <span className={style.infoValue}>
                                        {vehiculoSeleccionado.proximoMantenimientoKm?.toLocaleString()} km
                                    </span>
                                </div>
                                <div className={style.infoItem}>
                                    <span className={style.infoLabel}>Asignaciones completadas:</span>
                                    <span className={style.infoValue}>
                                        {vehiculoSeleccionado.asignacionesCompletadas}
                                    </span>
                                </div>
                            </div>

                            {/* Barra de progreso de mantenimiento */}
                            <div className={style.mantenimientoSection}>
                                <h4>Estado de Mantenimiento</h4>
                                <div className={style.progressContainer}>
                                    <div className={style.progressBar}>
                                        <div 
                                            className={`${style.progressFill} ${style[vehiculoSeleccionado.estadoMantenimiento]}`}
                                            style={{ width: `${vehiculoSeleccionado.porcentajeMantenimiento}%` }}
                                        ></div>
                                    </div>
                                    <span className={style.progressText}>
                                        {vehiculoSeleccionado.kmParaMantenimiento} km restantes
                                    </span>
                                </div>
                            </div>

                            {/* Historial de mantenimiento */}
                            <div className={style.historialSection}>
                                <h4>Historial de Mantenimiento</h4>
                                {vehiculoSeleccionado.historialMantenimiento?.length > 0 ? (
                                    <div className={style.historialList}>
                                        {vehiculoSeleccionado.historialMantenimiento.map(item => (
                                            <div key={item.id} className={style.historialItem}>
                                                <div className={style.historialFecha}>
                                                    {new Date(item.fecha).toLocaleDateString()}
                                                </div>
                                                <div className={style.historialInfo}>
                                                    <strong>{item.tipo}</strong>
                                                    <p>{item.descripcion}</p>
                                                    <span className={style.historialCosto}>
                                                        ${item.costo?.toLocaleString()}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className={style.sinHistorial}>No hay historial de mantenimiento registrado</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default VistaVehiculos;
