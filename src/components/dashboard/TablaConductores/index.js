// src/components/dashboard/TablaConductores/index.js
import { h } from 'preact';
import { useState } from 'preact/hooks';
import style from './style.css';

const TablaConductores = ({ conductores, onVerDetalles }) => {
    const [ordenamiento, setOrdenamiento] = useState({ campo: '', direccion: 'asc' });
    const [paginaActual, setPaginaActual] = useState(1);
    const [registrosPorPagina] = useState(10);

    // Función para ordenar conductores
    const manejarOrdenamiento = (campo) => {
        const nuevaDireccion = 
            ordenamiento.campo === campo && ordenamiento.direccion === 'asc' ? 'desc' : 'asc';
        
        setOrdenamiento({ campo, direccion: nuevaDireccion });
        setPaginaActual(1); // Resetear a primera página al ordenar
    };

    // Aplicar ordenamiento
    const conductoresOrdenados = [...conductores].sort((a, b) => {
        if (!ordenamiento.campo) return 0;

        let valorA = a[ordenamiento.campo];
        let valorB = b[ordenamiento.campo];

        // Manejar casos especiales
        if (ordenamiento.campo === 'nombre_completo') {
            valorA = `${a.nombre} ${a.apellido}`.toLowerCase();
            valorB = `${b.nombre} ${b.apellido}`.toLowerCase();
        }

        // Manejar números
        if (typeof valorA === 'number' && typeof valorB === 'number') {
            return ordenamiento.direccion === 'asc' ? valorA - valorB : valorB - valorA;
        }

        // Manejar strings
        if (typeof valorA === 'string' && typeof valorB === 'string') {
            valorA = valorA.toLowerCase();
            valorB = valorB.toLowerCase();
        }

        if (valorA < valorB) return ordenamiento.direccion === 'asc' ? -1 : 1;
        if (valorA > valorB) return ordenamiento.direccion === 'asc' ? 1 : -1;
        return 0;
    });

    // Aplicar paginación
    const indiceInicio = (paginaActual - 1) * registrosPorPagina;
    const indiceFin = indiceInicio + registrosPorPagina;
    const conductoresPaginados = conductoresOrdenados.slice(indiceInicio, indiceFin);
    const totalPaginas = Math.ceil(conductoresOrdenados.length / registrosPorPagina);

    const IconoOrdenamiento = ({ campo }) => {
        if (ordenamiento.campo !== campo) {
            return <span className={style.sortIcon}>↕️</span>;
        }
        return (
            <span className={style.sortIcon}>
                {ordenamiento.direccion === 'asc' ? '↑' : '↓'}
            </span>
        );
    };

    const obtenerIconoEstado = (estado) => {
        const iconos = {
            'disponible': '✅',
            'ocupado': '⏳',
            'en_ruta': '🚗',
            'no_disponible': '❌'
        };
        return iconos[estado] || '❓';
    };

    const obtenerIconoLicencia = (estadoLicencia) => {
        const iconos = {
            'vigente': '✅',
            'por_vencer': '⚠️',
            'vencida': '❌'
        };
        return iconos[estadoLicencia] || '❓';
    };

    const formatearFecha = (fecha) => {
        if (!fecha) return 'No especificada';
        return new Date(fecha).toLocaleDateString('es-CL', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const obtenerClaseEstado = (estado) => {
        return style[estado] || style.default;
    };

    const obtenerClaseLicencia = (estadoLicencia) => {
        return style[`licencia_${estadoLicencia}`] || style.default;
    };

    if (conductores.length === 0) {
        return (
            <div className={style.tablaContainer}>
                <div className={style.emptyState}>
                    <div className={style.emptyIcon}>👤</div>
                    <h3>No hay conductores para mostrar</h3>
                    <p>No se encontraron conductores que coincidan con los filtros aplicados.</p>
                </div>
            </div>
        );
    }

    return (
        <div className={style.tablaContainer}>
            <div className={style.tablaHeader}>
                <h3>Lista de Conductores ({conductoresOrdenados.length})</h3>
                <div className={style.paginationInfo}>
                    Mostrando {indiceInicio + 1}-{Math.min(indiceFin, conductoresOrdenados.length)} de {conductoresOrdenados.length}
                </div>
            </div>

            <div className={style.tablaWrapper}>
                <table className={style.tabla}>
                    <thead>
                        <tr>
                            <th onClick={() => manejarOrdenamiento('nombre_completo')} className={style.sortable}>
                                Conductor <IconoOrdenamiento campo="nombre_completo" />
                            </th>
                            <th onClick={() => manejarOrdenamiento('numero_licencia')} className={style.sortable}>
                                Licencia <IconoOrdenamiento campo="numero_licencia" />
                            </th>
                            <th onClick={() => manejarOrdenamiento('estadoLicencia')} className={style.sortable}>
                                Estado Licencia <IconoOrdenamiento campo="estadoLicencia" />
                            </th>
                            <th onClick={() => manejarOrdenamiento('estado_disponibilidad')} className={style.sortable}>
                                Disponibilidad <IconoOrdenamiento campo="estado_disponibilidad" />
                            </th>
                            <th onClick={() => manejarOrdenamiento('tasaEficiencia')} className={style.sortable}>
                                Eficiencia <IconoOrdenamiento campo="tasaEficiencia" />
                            </th>
                            <th onClick={() => manejarOrdenamiento('diasTrabajados30')} className={style.sortable}>
                                Actividad 30d <IconoOrdenamiento campo="diasTrabajados30" />
                            </th>
                            <th onClick={() => manejarOrdenamiento('kmRecorridos30')} className={style.sortable}>
                                Km Recorridos <IconoOrdenamiento campo="kmRecorridos30" />
                            </th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {conductoresPaginados.map((conductor) => (
                            <tr key={conductor.id} className={style.filaTabla}>
                                <td className={style.conductorInfo}>
                                    <div className={style.conductorNombre}>
                                        <strong>{conductor.nombre} {conductor.apellido}</strong>
                                        <span className={style.conductorRun}>
                                            {conductor.run || 'Sin RUN'}
                                        </span>
                                    </div>
                                </td>
                                <td>
                                    <div className={style.licenciaInfo}>
                                        <span className={style.numeroLicencia}>
                                            {conductor.numero_licencia}
                                        </span>
                                        <span className={style.vencimientoLicencia}>
                                            Vence: {formatearFecha(conductor.fecha_vencimiento_licencia)}
                                        </span>
                                    </div>
                                </td>
                                <td>
                                    <span className={`${style.estadoBadge} ${obtenerClaseLicencia(conductor.estadoLicencia)}`}>
                                        {obtenerIconoLicencia(conductor.estadoLicencia)} {conductor.estadoLicencia?.replace('_', ' ')}
                                    </span>
                                    {conductor.diasParaVencimientoLicencia <= 30 && conductor.diasParaVencimientoLicencia > 0 && (
                                        <div className={style.diasVencimiento}>
                                            {conductor.diasParaVencimientoLicencia} días
                                        </div>
                                    )}
                                </td>
                                <td>
                                    <span className={`${style.estadoBadge} ${obtenerClaseEstado(conductor.estado_disponibilidad)}`}>
                                        {obtenerIconoEstado(conductor.estado_disponibilidad)} {conductor.estado_disponibilidad?.replace('_', ' ')}
                                    </span>
                                </td>
                                <td>
                                    <div className={style.eficienciaContainer}>
                                        <div className={style.eficienciaBar}>
                                            <div 
                                                className={style.eficienciaFill}
                                                style={{ 
                                                    width: `${conductor.tasaEficiencia}%`,
                                                    backgroundColor: conductor.tasaEficiencia >= 80 ? '#28a745' : 
                                                                   conductor.tasaEficiencia >= 60 ? '#ffc107' : '#dc3545'
                                                }}
                                            ></div>
                                        </div>
                                        <span className={style.eficienciaTexto}>
                                            {conductor.tasaEficiencia}%
                                        </span>
                                    </div>
                                </td>
                                <td>
                                    <div className={style.actividadInfo}>
                                        <div className={style.diasTrabajados}>
                                            <strong>{conductor.diasTrabajados30}</strong> días trabajados
                                        </div>
                                        <div className={style.asignacionesInfo}>
                                            {conductor.asignacionesCompletadasPeriodo30}/{conductor.asignacionesPeriodo30} completadas
                                        </div>
                                    </div>
                                </td>
                                <td>
                                    <div className={style.kmInfo}>
                                        <strong>{conductor.kmRecorridos30}</strong> km
                                        <div className={style.promedioInfo}>
                                            Promedio: {conductor.tiempoPromedioAsignacion}h
                                        </div>
                                    </div>
                                </td>
                                <td>
                                    <div className={style.accionesContainer}>
                                        <button 
                                            onClick={() => onVerDetalles(conductor)}
                                            className={style.botonAccion}
                                            title="Ver detalles del conductor"
                                        >
                                            👁️ Ver
                                        </button>
                                    </div>
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
                        onClick={() => setPaginaActual(prev => Math.max(prev - 1, 1))}
                        disabled={paginaActual === 1}
                        className={style.botonPaginacion}
                    >
                        ← Anterior
                    </button>
                    
                    <div className={style.numerosPagina}>
                        {Array.from({ length: totalPaginas }, (_, i) => i + 1).map(numero => (
                            <button
                                key={numero}
                                onClick={() => setPaginaActual(numero)}
                                className={`${style.numeroPagina} ${paginaActual === numero ? style.activa : ''}`}
                            >
                                {numero}
                            </button>
                        ))}
                    </div>
                    
                    <button 
                        onClick={() => setPaginaActual(prev => Math.min(prev + 1, totalPaginas))}
                        disabled={paginaActual === totalPaginas}
                        className={style.botonPaginacion}
                    >
                        Siguiente →
                    </button>
                </div>
            )}
        </div>
    );
};

export default TablaConductores;
