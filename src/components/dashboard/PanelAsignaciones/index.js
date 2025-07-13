// src/components/dashboard/PanelAsignaciones/index.js
import { h } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import style from './style.css';

const PanelAsignaciones = ({ asignaciones, asignacionSeleccionada, onAsignacionSelect, visible, onClose }) => {
    const [filtroLocal, setFiltroLocal] = useState('todas');
    const [ordenamiento, setOrdenamiento] = useState('fecha');
    const [busqueda, setBusqueda] = useState('');

    // Filtrar y ordenar asignaciones
    const asignacionesFiltradas = asignaciones
        .filter(asignacion => {
            const coincideBusqueda = busqueda === '' || 
                asignacion.descripcion?.toLowerCase().includes(busqueda.toLowerCase()) ||
                asignacion.vehiculo?.patente?.toLowerCase().includes(busqueda.toLowerCase()) ||
                asignacion.conductor?.nombre?.toLowerCase().includes(busqueda.toLowerCase());
            
            const coincideFiltro = filtroLocal === 'todas' || asignacion.estado === filtroLocal;
            
            return coincideBusqueda && coincideFiltro;
        })
        .sort((a, b) => {
            switch (ordenamiento) {
                case 'fecha':
                    return new Date(b.fecha_inicio) - new Date(a.fecha_inicio);
                case 'estado':
                    return a.estado.localeCompare(b.estado);
                case 'vehiculo':
                    return a.vehiculo?.patente?.localeCompare(b.vehiculo?.patente || '') || 0;
                case 'conductor':
                    return a.conductor?.nombre?.localeCompare(b.conductor?.nombre || '') || 0;
                default:
                    return 0;
            }
        });

    const formatearFecha = (fecha) => {
        if (!fecha) return 'No especificada';
        const date = new Date(fecha);
        return date.toLocaleDateString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const obtenerIconoEstado = (estado) => {
        switch (estado) {
            case 'asignada': return '📅';
            case 'en_curso': return '🚗';
            case 'completada': return '✅';
            case 'cancelada': return '❌';
            default: return '📋';
        }
    };

    const obtenerColorEstado = (estado) => {
        switch (estado) {
            case 'asignada': return '#007bff';
            case 'en_curso': return '#28a745';
            case 'completada': return '#6f42c1';
            case 'cancelada': return '#dc3545';
            default: return '#6c757d';
        }
    };

    const calcularDuracion = (inicio, fin) => {
        if (!inicio || !fin) return 'En curso';
        const diff = new Date(fin) - new Date(inicio);
        const horas = Math.floor(diff / (1000 * 60 * 60));
        const minutos = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        return `${horas}h ${minutos}m`;
    };

    const obtenerEstadisticasRapidas = () => {
        const total = asignacionesFiltradas.length;
        const porEstado = asignacionesFiltradas.reduce((acc, asignacion) => {
            acc[asignacion.estado] = (acc[asignacion.estado] || 0) + 1;
            return acc;
        }, {});

        return {
            total,
            pendientes: porEstado.asignada || 0,
            enCurso: porEstado.en_curso || 0,
            completadas: porEstado.completada || 0,
            canceladas: porEstado.cancelada || 0
        };
    };

    const estadisticas = obtenerEstadisticasRapidas();

    if (!visible) return null;

    return (
        <div className={style.panelContainer}>
            <div className={style.panelHeader}>
                <div className={style.headerInfo}>
                    <h3>📋 Asignaciones</h3>
                    <span className={style.contadorTotal}>{estadisticas.total} encontradas</span>
                </div>
                <button 
                    onClick={onClose} 
                    className={style.botonCerrar}
                    title="Cerrar panel"
                >
                    ✕
                </button>
            </div>

            {/* Estadísticas rápidas */}
            <div className={style.estadisticasRapidas}>
                <div className={style.statRapida}>
                    <span className={style.statNumero}>{estadisticas.pendientes}</span>
                    <span className={style.statLabel}>📅 Pendientes</span>
                </div>
                <div className={style.statRapida}>
                    <span className={style.statNumero}>{estadisticas.enCurso}</span>
                    <span className={style.statLabel}>🚗 En Curso</span>
                </div>
                <div className={style.statRapida}>
                    <span className={style.statNumero}>{estadisticas.completadas}</span>
                    <span className={style.statLabel}>✅ Completadas</span>
                </div>
            </div>

            {/* Controles de filtro y búsqueda */}
            <div className={style.controlesPanel}>
                <div className={style.busquedaContainer}>
                    <input
                        type="text"
                        placeholder="🔍 Buscar asignaciones..."
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                        className={style.inputBusqueda}
                    />
                </div>

                <div className={style.filtrosRapidos}>
                    <select
                        value={filtroLocal}
                        onChange={(e) => setFiltroLocal(e.target.value)}
                        className={style.selectFiltro}
                    >
                        <option value="todas">Todas</option>
                        <option value="asignada">📅 Pendientes</option>
                        <option value="en_curso">🚗 En Curso</option>
                        <option value="completada">✅ Completadas</option>
                        <option value="cancelada">❌ Canceladas</option>
                    </select>

                    <select
                        value={ordenamiento}
                        onChange={(e) => setOrdenamiento(e.target.value)}
                        className={style.selectOrden}
                    >
                        <option value="fecha">📅 Por Fecha</option>
                        <option value="estado">📊 Por Estado</option>
                        <option value="vehiculo">🚗 Por Vehículo</option>
                        <option value="conductor">👤 Por Conductor</option>
                    </select>
                </div>
            </div>

            {/* Lista de asignaciones */}
            <div className={style.listaAsignaciones}>
                {asignacionesFiltradas.length === 0 ? (
                    <div className={style.sinResultados}>
                        <div className={style.iconoVacio}>📭</div>
                        <p>No se encontraron asignaciones</p>
                        <small>Intenta ajustar los filtros de búsqueda</small>
                    </div>
                ) : (
                    asignacionesFiltradas.map(asignacion => (
                        <div
                            key={asignacion.id}
                            className={`${style.asignacionItem} ${
                                asignacionSeleccionada?.id === asignacion.id ? style.seleccionada : ''
                            }`}
                            onClick={() => onAsignacionSelect(asignacion)}
                        >
                            <div className={style.asignacionHeader}>
                                <div className={style.estadoIndicador}>
                                    <span 
                                        className={style.iconoEstado}
                                        style={{ color: obtenerColorEstado(asignacion.estado) }}
                                    >
                                        {obtenerIconoEstado(asignacion.estado)}
                                    </span>
                                    <span className={style.textoEstado}>
                                        {asignacion.estado?.replace('_', ' ').toUpperCase()}
                                    </span>
                                </div>
                                <div className={style.fechaAsignacion}>
                                    {formatearFecha(asignacion.fecha_inicio)}
                                </div>
                            </div>

                            <div className={style.asignacionContent}>
                                <h4 className={style.descripcionAsignacion}>
                                    {asignacion.descripcion || 'Asignación sin descripción'}
                                </h4>

                                <div className={style.detallesAsignacion}>
                                    <div className={style.detalleItem}>
                                        <span className={style.detalleLabel}>🚗 Vehículo:</span>
                                        <span className={style.detalleValor}>
                                            {asignacion.vehiculo?.patente || 'No asignado'}
                                        </span>
                                    </div>
                                    
                                    <div className={style.detalleItem}>
                                        <span className={style.detalleLabel}>👤 Conductor:</span>
                                        <span className={style.detalleValor}>
                                            {asignacion.conductor ? 
                                                `${asignacion.conductor.nombre} ${asignacion.conductor.apellido}` : 
                                                'No asignado'
                                            }
                                        </span>
                                    </div>

                                    {asignacion.fecha_fin && (
                                        <div className={style.detalleItem}>
                                            <span className={style.detalleLabel}>⏱️ Duración:</span>
                                            <span className={style.detalleValor}>
                                                {calcularDuracion(asignacion.fecha_inicio, asignacion.fecha_fin)}
                                            </span>
                                        </div>
                                    )}

                                    {asignacion.coordenadas && (
                                        <div className={style.detalleItem}>
                                            <span className={style.detalleLabel}>📍 Ubicación:</span>
                                            <span className={style.detalleValor}>
                                                {asignacion.coordenadas?.actual?.lat !== undefined && asignacion.coordenadas?.actual?.lng !== undefined
                                                    ? `${asignacion.coordenadas.actual.lat.toFixed(6)}, ${asignacion.coordenadas.actual.lng.toFixed(6)}`
                                                    : 'N/A'}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {asignacion.observaciones && (
                                    <div className={style.observaciones}>
                                        <strong>📝 Observaciones:</strong>
                                        <p>{asignacion.observaciones}</p>
                                    </div>
                                )}
                            </div>

                            {asignacion.estado === 'en_curso' && (
                                <div className={style.indicadorActivo}>
                                    <div className={style.pulsoDot}></div>
                                    <span>En tiempo real</span>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>

            {/* Detalles de asignación seleccionada */}
            {asignacionSeleccionada && (
                <div className={style.detalleSeleccionada}>
                    <h4>📋 Detalles de la Asignación</h4>
                    <div className={style.informacionDetallada}>
                        <div className={style.campoDetalle}>
                            <strong>ID:</strong> {asignacionSeleccionada.id}
                        </div>
                        <div className={style.campoDetalle}>
                            <strong>Descripción:</strong> {asignacionSeleccionada.descripcion}
                        </div>
                        <div className={style.campoDetalle}>
                            <strong>Estado:</strong> 
                            <span 
                                className={style.estadoBadge}
                                style={{ backgroundColor: obtenerColorEstado(asignacionSeleccionada.estado) }}
                            >
                                {obtenerIconoEstado(asignacionSeleccionada.estado)} {asignacionSeleccionada.estado}
                            </span>
                        </div>
                        <div className={style.campoDetalle}>
                            <strong>Fecha Inicio:</strong> {formatearFecha(asignacionSeleccionada.fecha_inicio)}
                        </div>
                        {asignacionSeleccionada.fecha_fin && (
                            <div className={style.campoDetalle}>
                                <strong>Fecha Fin:</strong> {formatearFecha(asignacionSeleccionada.fecha_fin)}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default PanelAsignaciones;
