// src/components/dashboard/FiltrosConductores/index.js
import { h } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import style from './style.css';

const FiltrosConductores = ({ filtros, onChange, conductores }) => {
    const [filtrosLocales, setFiltrosLocales] = useState(filtros);
    const [conteos, setConteos] = useState({});
    const [mostrarFiltrosAvanzados, setMostrarFiltrosAvanzados] = useState(false);

    // Actualizar filtros locales cuando cambien los props
    useEffect(() => {
        setFiltrosLocales(filtros);
    }, [filtros]);

    // Calcular conteos dinámicos
    useEffect(() => {
        const calcularConteos = () => {
            const nuevosConteos = {
                total: conductores.length,
                estados: {},
                disponibilidad: {},
                licencias: {}
            };

            // Contar por estado
            conductores.forEach(conductor => {
                // Estados de disponibilidad
                const estado = conductor.estado_disponibilidad || 'sin_estado';
                nuevosConteos.estados[estado] = (nuevosConteos.estados[estado] || 0) + 1;

                // Niveles de disponibilidad
                let nivelDisponibilidad;
                if (conductor.disponibilidadPorcentaje >= 75) {
                    nivelDisponibilidad = 'alta';
                } else if (conductor.disponibilidadPorcentaje >= 50) {
                    nivelDisponibilidad = 'media';
                } else {
                    nivelDisponibilidad = 'baja';
                }
                nuevosConteos.disponibilidad[nivelDisponibilidad] = 
                    (nuevosConteos.disponibilidad[nivelDisponibilidad] || 0) + 1;

                // Estados de licencia
                const estadoLicencia = conductor.estadoLicencia || 'sin_estado';
                nuevosConteos.licencias[estadoLicencia] = (nuevosConteos.licencias[estadoLicencia] || 0) + 1;
            });

            setConteos(nuevosConteos);
        };

        calcularConteos();
    }, [conductores]);

    const handleInputChange = (campo, valor) => {
        const nuevosFiltros = { ...filtrosLocales, [campo]: valor };
        setFiltrosLocales(nuevosFiltros);
        onChange(nuevosFiltros);
    };

    const limpiarFiltros = () => {
        const filtrosLimpios = {
            busqueda: '',
            estado: 'todos',
            disponibilidad: 'todos'
        };
        setFiltrosLocales(filtrosLimpios);
        onChange(filtrosLimpios);
    };

    const obtenerFiltrosActivos = () => {
        const activos = [];
        if (filtrosLocales.busqueda) {
            activos.push({ tipo: 'busqueda', valor: filtrosLocales.busqueda });
        }
        if (filtrosLocales.estado !== 'todos') {
            activos.push({ tipo: 'estado', valor: filtrosLocales.estado });
        }
        if (filtrosLocales.disponibilidad !== 'todos') {
            activos.push({ tipo: 'disponibilidad', valor: filtrosLocales.disponibilidad });
        }
        return activos;
    };

    const filtrosActivos = obtenerFiltrosActivos();

    const obtenerTextoFiltro = (tipo, valor) => {
        const textos = {
            busqueda: `Búsqueda: "${valor}"`,
            estado: `Estado: ${valor.replace('_', ' ')}`,
            disponibilidad: `Disponibilidad: ${valor}`
        };
        return textos[tipo] || valor;
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

    return (
        <div className={style.filtrosContainer}>
            {/* Barra principal de filtros */}
            <div className={style.filtrosPrincipales}>
                {/* Búsqueda */}
                <div className={style.campoBusqueda}>
                    <div className={style.inputContainer}>
                        <span className={style.searchIcon}>🔍</span>
                        <input
                            type="text"
                            placeholder="Buscar por nombre, RUN o licencia..."
                            value={filtrosLocales.busqueda}
                            onChange={(e) => handleInputChange('busqueda', e.target.value)}
                            className={style.inputBusqueda}
                        />
                        {filtrosLocales.busqueda && (
                            <button
                                onClick={() => handleInputChange('busqueda', '')}
                                className={style.clearButton}
                                title="Limpiar búsqueda"
                            >
                                ✕
                            </button>
                        )}
                    </div>
                </div>

                {/* Estado de disponibilidad */}
                <div className={style.campoFiltro}>
                    <label className={style.etiquetaFiltro}>Estado:</label>
                    <select
                        value={filtrosLocales.estado}
                        onChange={(e) => handleInputChange('estado', e.target.value)}
                        className={style.selectFiltro}
                    >
                        <option value="todos">Todos ({conteos.total})</option>
                        <option value="disponible">
                            {obtenerIconoEstado('disponible')} Disponible ({conteos.estados?.disponible || 0})
                        </option>
                        <option value="ocupado">
                            {obtenerIconoEstado('ocupado')} Ocupado ({conteos.estados?.ocupado || 0})
                        </option>
                        <option value="en_ruta">
                            {obtenerIconoEstado('en_ruta')} En Ruta ({conteos.estados?.en_ruta || 0})
                        </option>
                        <option value="no_disponible">
                            {obtenerIconoEstado('no_disponible')} No Disponible ({conteos.estados?.no_disponible || 0})
                        </option>
                    </select>
                </div>

                {/* Nivel de disponibilidad */}
                <div className={style.campoFiltro}>
                    <label className={style.etiquetaFiltro}>Disponibilidad:</label>
                    <select
                        value={filtrosLocales.disponibilidad}
                        onChange={(e) => handleInputChange('disponibilidad', e.target.value)}
                        className={style.selectFiltro}
                    >
                        <option value="todos">Todos</option>
                        <option value="alta">
                            📈 Alta (≥75%) ({conteos.disponibilidad?.alta || 0})
                        </option>
                        <option value="media">
                            📊 Media (50-74%) ({conteos.disponibilidad?.media || 0})
                        </option>
                        <option value="baja">
                            📉 Baja (&lt;50%) ({conteos.disponibilidad?.baja || 0})
                        </option>
                    </select>
                </div>

                {/* Botones de acción */}
                <div className={style.botonesAccion}>
                    <button
                        onClick={() => setMostrarFiltrosAvanzados(!mostrarFiltrosAvanzados)}
                        className={style.botonToggle}
                    >
                        {mostrarFiltrosAvanzados ? '🔼' : '🔽'} Avanzado
                    </button>
                    
                    {filtrosActivos.length > 0 && (
                        <button
                            onClick={limpiarFiltros}
                            className={style.botonLimpiar}
                        >
                            🗑️ Limpiar
                        </button>
                    )}
                </div>
            </div>

            {/* Filtros avanzados */}
            {mostrarFiltrosAvanzados && (
                <div className={style.filtrosAvanzados}>
                    <div className={style.seccionAvanzada}>
                        <h4>Estados de Licencia</h4>
                        <div className={style.estadisticasLicencias}>
                            <div className={style.estadLicencia}>
                                <span className={style.estadIcono}>✅</span>
                                <span className={style.estadTexto}>
                                    Vigentes: {conteos.licencias?.vigente || 0}
                                </span>
                            </div>
                            <div className={style.estadLicencia}>
                                <span className={style.estadIcono}>⚠️</span>
                                <span className={style.estadTexto}>
                                    Por vencer: {conteos.licencias?.por_vencer || 0}
                                </span>
                            </div>
                            <div className={style.estadLicencia}>
                                <span className={style.estadIcono}>❌</span>
                                <span className={style.estadTexto}>
                                    Vencidas: {conteos.licencias?.vencida || 0}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className={style.seccionAvanzada}>
                        <h4>Filtros Rápidos</h4>
                        <div className={style.filtrosRapidos}>
                            <button
                                onClick={() => handleInputChange('estado', 'disponible')}
                                className={`${style.filtroRapido} ${filtrosLocales.estado === 'disponible' ? style.activo : ''}`}
                            >
                                ✅ Solo Disponibles
                            </button>
                            <button
                                onClick={() => handleInputChange('disponibilidad', 'alta')}
                                className={`${style.filtroRapido} ${filtrosLocales.disponibilidad === 'alta' ? style.activo : ''}`}
                            >
                                📈 Alta Disponibilidad
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Filtros activos */}
            {filtrosActivos.length > 0 && (
                <div className={style.filtrosActivos}>
                    <span className={style.tituloActivos}>Filtros activos:</span>
                    <div className={style.listaFiltrosActivos}>
                        {filtrosActivos.map((filtro, index) => (
                            <span key={index} className={style.filtroActivo}>
                                {obtenerTextoFiltro(filtro.tipo, filtro.valor)}
                                <button
                                    onClick={() => {
                                        if (filtro.tipo === 'busqueda') {
                                            handleInputChange('busqueda', '');
                                        } else {
                                            handleInputChange(filtro.tipo, 'todos');
                                        }
                                    }}
                                    className={style.quitarFiltro}
                                    title="Quitar filtro"
                                >
                                    ✕
                                </button>
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {/* Resumen de resultados */}
            <div className={style.resumenResultados}>
                <div className={style.conteoResultados}>
                    <span className={style.numeroResultados}>
                        {conductores.filter(conductor => {
                            const coincideBusqueda = !filtrosLocales.busqueda || 
                                conductor.nombre.toLowerCase().includes(filtrosLocales.busqueda.toLowerCase()) ||
                                conductor.apellido.toLowerCase().includes(filtrosLocales.busqueda.toLowerCase()) ||
                                conductor.run?.toLowerCase().includes(filtrosLocales.busqueda.toLowerCase()) ||
                                conductor.numero_licencia.toLowerCase().includes(filtrosLocales.busqueda.toLowerCase());

                            const coincideEstado = filtrosLocales.estado === 'todos' || 
                                conductor.estado_disponibilidad === filtrosLocales.estado;
                            
                            const coincideDisponibilidad = filtrosLocales.disponibilidad === 'todos' || (() => {
                                switch (filtrosLocales.disponibilidad) {
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
                        }).length}
                    </span>
                    <span className={style.textoResultados}>
                        conductores encontrados de {conteos.total} total
                    </span>
                </div>
            </div>
        </div>
    );
};

export default FiltrosConductores;
