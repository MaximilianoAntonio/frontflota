// src/components/dashboard/FiltrosMapa/index.js
import { h } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import style from './style.css';

const FiltrosMapa = ({ filtros, onChange, conductores, vehiculos, estadisticas }) => {
    const [filtrosLocales, setFiltrosLocales] = useState(filtros);
    const [seccionExpandida, setSeccionExpandida] = useState('filtros');

    useEffect(() => {
        setFiltrosLocales(filtros);
    }, [filtros]);

    const handleInputChange = (campo, valor) => {
        const nuevosFiltros = { ...filtrosLocales, [campo]: valor };
        setFiltrosLocales(nuevosFiltros);
        onChange(nuevosFiltros);
    };

    const limpiarFiltros = () => {
        const filtrosLimpios = {
            estado: 'todas',
            tipoVehiculo: 'todos',
            conductor: 'todos',
            fechaInicio: '',
            fechaFin: '',
            mostrarRutas: true,
            mostrarConductores: true,
            mostrarVehiculos: true
        };
        setFiltrosLocales(filtrosLimpios);
        onChange(filtrosLimpios);
    };

    const toggleSeccion = (seccion) => {
        setSeccionExpandida(seccionExpandida === seccion ? null : seccion);
    };

    const obtenerFechaHoy = () => {
        return new Date().toISOString().split('T')[0];
    };

    const obtenerFechaSemana = () => {
        const fecha = new Date();
        fecha.setDate(fecha.getDate() + 7);
        return fecha.toISOString().split('T')[0];
    };

    // Obtener tipos únicos de vehículos
    const tiposVehiculos = [...new Set(vehiculos.map(v => v.tipo).filter(Boolean))];

    return (
        <div className={style.filtrosContainer}>
            {/* Header con estadísticas */}
            <div className={style.headerFiltros}>
                <h3>Filtros del Mapa</h3>
                <div className={style.resumenStats}>
                    <div className={style.statItem}>
                        <span className={style.statNumber}>{estadisticas.total}</span>
                        <span className={style.statLabel}>Total</span>
                    </div>
                    <div className={style.statItem}>
                        <span className={style.statNumber}>{estadisticas.enCurso}</span>
                        <span className={style.statLabel}>Activas</span>
                    </div>
                </div>
            </div>

            {/* Sección: Filtros principales */}
            <div className={style.seccionFiltros}>
                <div 
                    className={style.seccionHeader}
                    onClick={() => toggleSeccion('filtros')}
                >
                    <h4>🔍 Filtros Principales</h4>
                    <span className={style.toggleIcon}>
                        {seccionExpandida === 'filtros' ? '▼' : '▶'}
                    </span>
                </div>

                {seccionExpandida === 'filtros' && (
                    <div className={style.seccionContent}>
                        {/* Estado de asignación */}
                        <div className={style.campoFiltro}>
                            <label className={style.labelFiltro}>Estado:</label>
                            <select
                                value={filtrosLocales.estado}
                                onChange={(e) => handleInputChange('estado', e.target.value)}
                                className={style.selectFiltro}
                            >
                                <option value="todas">Todas las asignaciones</option>
                                <option value="asignada">📅 Programadas</option>
                                <option value="en_curso">🚗 En curso</option>
                                <option value="completada">✅ Completadas</option>
                                <option value="cancelada">❌ Canceladas</option>
                            </select>
                        </div>

                        {/* Tipo de vehículo */}
                        <div className={style.campoFiltro}>
                            <label className={style.labelFiltro}>Tipo de Vehículo:</label>
                            <select
                                value={filtrosLocales.tipoVehiculo}
                                onChange={(e) => handleInputChange('tipoVehiculo', e.target.value)}
                                className={style.selectFiltro}
                            >
                                <option value="todos">Todos los tipos</option>
                                {tiposVehiculos.map(tipo => (
                                    <option key={tipo} value={tipo}>
                                        {tipo.charAt(0).toUpperCase() + tipo.slice(1)}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Conductor */}
                        <div className={style.campoFiltro}>
                            <label className={style.labelFiltro}>Conductor:</label>
                            <select
                                value={filtrosLocales.conductor}
                                onChange={(e) => handleInputChange('conductor', e.target.value)}
                                className={style.selectFiltro}
                            >
                                <option value="todos">Todos los conductores</option>
                                {conductores.map(conductor => (
                                    <option key={conductor.id} value={conductor.id}>
                                        {conductor.nombre} {conductor.apellido}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                )}
            </div>

            {/* Sección: Filtros de fecha */}
            <div className={style.seccionFiltros}>
                <div 
                    className={style.seccionHeader}
                    onClick={() => toggleSeccion('fechas')}
                >
                    <h4>📅 Rango de Fechas</h4>
                    <span className={style.toggleIcon}>
                        {seccionExpandida === 'fechas' ? '▼' : '▶'}
                    </span>
                </div>

                {seccionExpandida === 'fechas' && (
                    <div className={style.seccionContent}>
                        <div className={style.campoFiltro}>
                            <label className={style.labelFiltro}>Fecha Inicio:</label>
                            <input
                                type="date"
                                value={filtrosLocales.fechaInicio}
                                onChange={(e) => handleInputChange('fechaInicio', e.target.value)}
                                className={style.inputFiltro}
                            />
                        </div>

                        <div className={style.campoFiltro}>
                            <label className={style.labelFiltro}>Fecha Fin:</label>
                            <input
                                type="date"
                                value={filtrosLocales.fechaFin}
                                onChange={(e) => handleInputChange('fechaFin', e.target.value)}
                                className={style.inputFiltro}
                            />
                        </div>

                        {/* Filtros rápidos de fecha */}
                        <div className={style.filtrosRapidos}>
                            <button
                                onClick={() => {
                                    handleInputChange('fechaInicio', obtenerFechaHoy());
                                    handleInputChange('fechaFin', obtenerFechaHoy());
                                }}
                                className={style.filtroRapido}
                            >
                                📅 Hoy
                            </button>
                            <button
                                onClick={() => {
                                    handleInputChange('fechaInicio', obtenerFechaHoy());
                                    handleInputChange('fechaFin', obtenerFechaSemana());
                                }}
                                className={style.filtroRapido}
                            >
                                📆 Esta Semana
                            </button>
                            <button
                                onClick={() => {
                                    handleInputChange('fechaInicio', '');
                                    handleInputChange('fechaFin', '');
                                }}
                                className={style.filtroRapido}
                            >
                                🗓️ Todas
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Sección: Opciones de visualización */}
            <div className={style.seccionFiltros}>
                <div 
                    className={style.seccionHeader}
                    onClick={() => toggleSeccion('visualizacion')}
                >
                    <h4>👁️ Visualización</h4>
                    <span className={style.toggleIcon}>
                        {seccionExpandida === 'visualizacion' ? '▼' : '▶'}
                    </span>
                </div>

                {seccionExpandida === 'visualizacion' && (
                    <div className={style.seccionContent}>
                        <div className={style.checkboxGroup}>
                            <label className={style.checkboxLabel}>
                                <input
                                    type="checkbox"
                                    checked={filtrosLocales.mostrarRutas}
                                    onChange={(e) => handleInputChange('mostrarRutas', e.target.checked)}
                                    className={style.checkbox}
                                />
                                <span className={style.checkboxText}>🗺️ Mostrar rutas</span>
                            </label>

                            <label className={style.checkboxLabel}>
                                <input
                                    type="checkbox"
                                    checked={filtrosLocales.mostrarConductores}
                                    onChange={(e) => handleInputChange('mostrarConductores', e.target.checked)}
                                    className={style.checkbox}
                                />
                                <span className={style.checkboxText}>👤 Mostrar conductores</span>
                            </label>

                            <label className={style.checkboxLabel}>
                                <input
                                    type="checkbox"
                                    checked={filtrosLocales.mostrarVehiculos}
                                    onChange={(e) => handleInputChange('mostrarVehiculos', e.target.checked)}
                                    className={style.checkbox}
                                />
                                <span className={style.checkboxText}>🚗 Mostrar vehículos</span>
                            </label>
                        </div>
                    </div>
                )}
            </div>

            {/* Sección: Estadísticas detalladas */}
            <div className={style.seccionFiltros}>
                <div 
                    className={style.seccionHeader}
                    onClick={() => toggleSeccion('estadisticas')}
                >
                    <h4>📊 Estadísticas</h4>
                    <span className={style.toggleIcon}>
                        {seccionExpandida === 'estadisticas' ? '▼' : '▶'}
                    </span>
                </div>

                {seccionExpandida === 'estadisticas' && (
                    <div className={style.seccionContent}>
                        <div className={style.estadisticasDetalle}>
                            <div className={style.estatDetalle}>
                                <span className={style.estatLabel}>📋 Pendientes:</span>
                                <span className={style.estatValor}>{estadisticas.pendientes}</span>
                            </div>
                            <div className={style.estatDetalle}>
                                <span className={style.estatLabel}>✅ Completadas:</span>
                                <span className={style.estatValor}>{estadisticas.completadas}</span>
                            </div>
                            <div className={style.estatDetalle}>
                                <span className={style.estatLabel}>⚠️ Urgentes:</span>
                                <span className={style.estatValor}>{estadisticas.urgentes}</span>
                            </div>
                            <div className={style.estatDetalle}>
                                <span className={style.estatLabel}>🚗 Vehículos activos:</span>
                                <span className={style.estatValor}>{estadisticas.vehiculosActivos}</span>
                            </div>
                            <div className={style.estatDetalle}>
                                <span className={style.estatLabel}>👤 Conductores activos:</span>
                                <span className={style.estatValor}>{estadisticas.conductoresActivos}</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Botón para limpiar filtros */}
            <div className={style.accionesFiltros}>
                <button
                    onClick={limpiarFiltros}
                    className={style.botonLimpiar}
                >
                    🗑️ Limpiar Filtros
                </button>
            </div>
        </div>
    );
};

export default FiltrosMapa;
