// src/components/dashboard/TablaVehiculos/index.js
import { h } from 'preact';
import { useState } from 'preact/hooks';
import style from './style.css';

const TablaVehiculos = ({ vehiculos, onVerDetalles }) => {
    const [ordenamiento, setOrdenamiento] = useState({ campo: 'patente', direccion: 'asc' });
    const [paginaActual, setPaginaActual] = useState(1);
    const vehiculosPorPagina = 10;

    const handleOrdenar = (campo) => {
        const direccion = ordenamiento.campo === campo && ordenamiento.direccion === 'asc' ? 'desc' : 'asc';
        setOrdenamiento({ campo, direccion });
    };

    const vehiculosOrdenados = [...vehiculos].sort((a, b) => {
        const aVal = a[ordenamiento.campo];
        const bVal = b[ordenamiento.campo];
        
        if (typeof aVal === 'string') {
            return ordenamiento.direccion === 'asc' 
                ? aVal.localeCompare(bVal)
                : bVal.localeCompare(aVal);
        }
        
        return ordenamiento.direccion === 'asc' ? aVal - bVal : bVal - aVal;
    });

    const indiceInicio = (paginaActual - 1) * vehiculosPorPagina;
    const vehiculosPagina = vehiculosOrdenados.slice(indiceInicio, indiceInicio + vehiculosPorPagina);
    const totalPaginas = Math.ceil(vehiculos.length / vehiculosPorPagina);

    const getEstadoIcon = (estado) => {
        const iconos = {
            disponible: '✅',
            en_uso: '🚗',
            mantenimiento: '🔧',
            reservado: '📋'
        };
        return iconos[estado] || '❓';
    };

    const getMantenimientoIcon = (estadoMantenimiento) => {
        const iconos = {
            bueno: '🟢',
            atencion: '🟡',
            critico: '🔴'
        };
        return iconos[estadoMantenimiento] || '⚪';
    };

    const getSortIcon = (campo) => {
        if (ordenamiento.campo !== campo) return '↕️';
        return ordenamiento.direccion === 'asc' ? '⬆️' : '⬇️';
    };

    if (vehiculos.length === 0) {
        return (
            <div className={style.noVehiculos}>
                <div className={style.noVehiculosIcon}>🚗</div>
                <h3>No se encontraron vehículos</h3>
                <p>No hay vehículos que coincidan con los filtros seleccionados</p>
            </div>
        );
    }

    return (
        <div className={style.tablaContainer}>
            <div className={style.tablaHeader}>
                <h3>Vehículos Detallados</h3>
                <div className={style.resultadosInfo}>
                    Mostrando {vehiculosPagina.length} de {vehiculos.length} vehículos
                </div>
            </div>

            <div className={style.tablaWrapper}>
                <table className={style.tabla}>
                    <thead>
                        <tr>
                            <th onClick={() => handleOrdenar('patente')} className={style.sortable}>
                                Patente {getSortIcon('patente')}
                            </th>
                            <th onClick={() => handleOrdenar('marca')} className={style.sortable}>
                                Vehículo {getSortIcon('marca')}
                            </th>
                            <th onClick={() => handleOrdenar('estado')} className={style.sortable}>
                                Estado {getSortIcon('estado')}
                            </th>
                            <th onClick={() => handleOrdenar('kilometraje')} className={style.sortable}>
                                Kilometraje {getSortIcon('kilometraje')}
                            </th>
                            <th onClick={() => handleOrdenar('porcentajeMantenimiento')} className={style.sortable}>
                                Mantenimiento {getSortIcon('porcentajeMantenimiento')}
                            </th>
                            <th onClick={() => handleOrdenar('utilizacion')} className={style.sortable}>
                                Uso (30d) {getSortIcon('utilizacion')}
                            </th>
                            <th onClick={() => handleOrdenar('totalAsignaciones')} className={style.sortable}>
                                Asignaciones {getSortIcon('totalAsignaciones')}
                            </th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {vehiculosPagina.map(vehiculo => (
                            <tr key={vehiculo.id} className={style.filaVehiculo}>
                                <td className={style.patente}>
                                    <strong>{vehiculo.patente}</strong>
                                </td>
                                <td>
                                    <div className={style.vehiculoInfo}>
                                        <div className={style.vehiculoNombre}>
                                            {vehiculo.marca} {vehiculo.modelo}
                                        </div>
                                        <div className={style.vehiculoAnio}>
                                            {vehiculo.anio} • {vehiculo.tipo_vehiculo_display || vehiculo.tipo_vehiculo}
                                        </div>
                                    </div>
                                </td>
                                <td>
                                    <span className={`${style.estadoBadge} ${style[vehiculo.estado]}`}>
                                        {getEstadoIcon(vehiculo.estado)} {vehiculo.estado}
                                    </span>
                                </td>
                                <td>
                                    <div className={style.kilometrajeInfo}>
                                        <div className={style.kmActual}>
                                            {vehiculo.kilometraje?.toLocaleString()} km
                                        </div>
                                        <div className={style.kmProximo}>
                                            Próx: {vehiculo.proximoMantenimientoKm?.toLocaleString()} km
                                        </div>
                                    </div>
                                </td>
                                <td>
                                    <div className={style.mantenimientoInfo}>
                                        <div className={style.mantenimientoEstado}>
                                            {getMantenimientoIcon(vehiculo.estadoMantenimiento)}
                                            <span className={style[vehiculo.estadoMantenimiento]}>
                                                {vehiculo.kmParaMantenimiento} km
                                            </span>
                                        </div>
                                        <div className={style.progressBarSmall}>
                                            <div 
                                                className={`${style.progressFillSmall} ${style[vehiculo.estadoMantenimiento]}`}
                                                style={{ width: `${vehiculo.porcentajeMantenimiento}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                </td>
                                <td>
                                    <div className={style.utilizacionInfo}>
                                        <div className={style.utilizacionPorcentaje}>
                                            {vehiculo.utilizacion?.toFixed(1)}%
                                        </div>
                                        <div className={style.utilizacionDias}>
                                            {vehiculo.diasUsados30} días
                                        </div>
                                    </div>
                                </td>
                                <td>
                                    <div className={style.asignacionesInfo}>
                                        <div className={style.asignacionesTotal}>
                                            {vehiculo.totalAsignaciones}
                                        </div>
                                        <div className={style.asignacionesCompletadas}>
                                            {vehiculo.asignacionesCompletadas} completadas
                                        </div>
                                    </div>
                                </td>
                                <td>
                                    <button 
                                        onClick={() => onVerDetalles(vehiculo)}
                                        className={style.verDetallesBtn}
                                    >
                                        Ver Detalles
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Paginación */}
            {totalPaginas > 1 && (
                <div className={style.paginacion}>
                    <button 
                        onClick={() => setPaginaActual(Math.max(1, paginaActual - 1))}
                        disabled={paginaActual === 1}
                        className={style.paginaBtn}
                    >
                        ← Anterior
                    </button>
                    
                    <div className={style.paginaInfo}>
                        Página {paginaActual} de {totalPaginas}
                    </div>
                    
                    <button 
                        onClick={() => setPaginaActual(Math.min(totalPaginas, paginaActual + 1))}
                        disabled={paginaActual === totalPaginas}
                        className={style.paginaBtn}
                    >
                        Siguiente →
                    </button>
                </div>
            )}
        </div>
    );
};

export default TablaVehiculos;
