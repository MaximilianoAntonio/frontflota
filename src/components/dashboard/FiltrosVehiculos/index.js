// src/components/dashboard/FiltrosVehiculos/index.js
import { h } from 'preact';
import style from './style.css';

const FiltrosVehiculos = ({ filtros, onChange, vehiculos }) => {
    const handleFiltroChange = (campo, valor) => {
        onChange({ [campo]: valor });
    };

    // Obtener opciones únicas de los vehículos
    const tiposVehiculo = [...new Set(vehiculos.map(v => v.tipo_vehiculo))].filter(Boolean);
    const estadosMantenimiento = ['bueno', 'atencion', 'critico'];

    const contarVehiculos = (filtroTipo, valor) => {
        return vehiculos.filter(vehiculo => {
            switch (filtroTipo) {
                case 'estado':
                    return vehiculo.estado === valor;
                case 'tipoVehiculo':
                    return vehiculo.tipo_vehiculo === valor;
                case 'mantenimiento':
                    return vehiculo.estadoMantenimiento === valor;
                default:
                    return true;
            }
        }).length;
    };

    return (
        <div className={style.filtrosContainer}>
            <div className={style.filtrosHeader}>
                <h3>Filtros de Búsqueda</h3>
                <button 
                    onClick={() => onChange({
                        busqueda: '',
                        estado: 'todos',
                        tipoVehiculo: 'todos',
                        mantenimiento: 'todos'
                    })}
                    className={style.limpiarFiltros}
                >
                    Limpiar Filtros
                </button>
            </div>

            <div className={style.filtrosGrid}>
                {/* Búsqueda por texto */}
                <div className={style.filtroGroup}>
                    <label className={style.label}>
                        🔍 Buscar vehículo:
                    </label>
                    <input
                        type="text"
                        value={filtros.busqueda}
                        onChange={(e) => handleFiltroChange('busqueda', e.target.value)}
                        placeholder="Patente, marca o modelo..."
                        className={style.inputBusqueda}
                    />
                </div>

                {/* Filtro por estado */}
                <div className={style.filtroGroup}>
                    <label className={style.label}>
                        📊 Estado del vehículo:
                    </label>
                    <select
                        value={filtros.estado}
                        onChange={(e) => handleFiltroChange('estado', e.target.value)}
                        className={style.select}
                    >
                        <option value="todos">Todos los estados</option>
                        <option value="disponible">
                            Disponible ({contarVehiculos('estado', 'disponible')})
                        </option>
                        <option value="en_uso">
                            En Uso ({contarVehiculos('estado', 'en_uso')})
                        </option>
                        <option value="mantenimiento">
                            Mantenimiento ({contarVehiculos('estado', 'mantenimiento')})
                        </option>
                        <option value="reservado">
                            Reservado ({contarVehiculos('estado', 'reservado')})
                        </option>
                    </select>
                </div>

                {/* Filtro por tipo de vehículo */}
                <div className={style.filtroGroup}>
                    <label className={style.label}>
                        🚗 Tipo de vehículo:
                    </label>
                    <select
                        value={filtros.tipoVehiculo}
                        onChange={(e) => handleFiltroChange('tipoVehiculo', e.target.value)}
                        className={style.select}
                    >
                        <option value="todos">Todos los tipos</option>
                        {tiposVehiculo.map(tipo => (
                            <option key={tipo} value={tipo}>
                                {tipo} ({contarVehiculos('tipoVehiculo', tipo)})
                            </option>
                        ))}
                    </select>
                </div>

                {/* Filtro por estado de mantenimiento */}
                <div className={style.filtroGroup}>
                    <label className={style.label}>
                        🔧 Estado de mantenimiento:
                    </label>
                    <select
                        value={filtros.mantenimiento}
                        onChange={(e) => handleFiltroChange('mantenimiento', e.target.value)}
                        className={style.select}
                    >
                        <option value="todos">Todos los estados</option>
                        <option value="bueno">
                            🟢 Bueno ({contarVehiculos('mantenimiento', 'bueno')})
                        </option>
                        <option value="atencion">
                            🟡 Atención ({contarVehiculos('mantenimiento', 'atencion')})
                        </option>
                        <option value="critico">
                            🔴 Crítico ({contarVehiculos('mantenimiento', 'critico')})
                        </option>
                    </select>
                </div>
            </div>

            {/* Resumen de filtros activos */}
            <div className={style.filtrosActivos}>
                {Object.entries(filtros).some(([key, value]) => 
                    value && value !== 'todos' && value !== ''
                ) && (
                    <div className={style.filtrosActivosContent}>
                        <span className={style.filtrosActivosLabel}>Filtros activos:</span>
                        <div className={style.filtrosActivosList}>
                            {filtros.busqueda && (
                                <span className={style.filtroActivo}>
                                    Búsqueda: "{filtros.busqueda}"
                                    <button 
                                        onClick={() => handleFiltroChange('busqueda', '')}
                                        className={style.removerFiltro}
                                    >
                                        ✕
                                    </button>
                                </span>
                            )}
                            {filtros.estado !== 'todos' && (
                                <span className={style.filtroActivo}>
                                    Estado: {filtros.estado}
                                    <button 
                                        onClick={() => handleFiltroChange('estado', 'todos')}
                                        className={style.removerFiltro}
                                    >
                                        ✕
                                    </button>
                                </span>
                            )}
                            {filtros.tipoVehiculo !== 'todos' && (
                                <span className={style.filtroActivo}>
                                    Tipo: {filtros.tipoVehiculo}
                                    <button 
                                        onClick={() => handleFiltroChange('tipoVehiculo', 'todos')}
                                        className={style.removerFiltro}
                                    >
                                        ✕
                                    </button>
                                </span>
                            )}
                            {filtros.mantenimiento !== 'todos' && (
                                <span className={style.filtroActivo}>
                                    Mantenimiento: {filtros.mantenimiento}
                                    <button 
                                        onClick={() => handleFiltroChange('mantenimiento', 'todos')}
                                        className={style.removerFiltro}
                                    >
                                        ✕
                                    </button>
                                </span>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default FiltrosVehiculos;
