// src/components/DashboardFilters/index.js
import { h } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import { motion } from 'framer-motion';
import style from './style.css';

const DashboardFilters = ({ onFiltersChange, isLoading }) => {
    const [filtros, setFiltros] = useState({
        tipo_periodo: 'diario',
        fecha_inicio: '',
        fecha_fin: '',
        periodo_predefinido: '30_dias'
    });

    const periodosPredefinidos = [
        { value: '7_dias', label: 'Últimos 7 días' },
        { value: '30_dias', label: 'Últimos 30 días' },
        { value: '90_dias', label: 'Últimos 3 meses' },
        { value: '180_dias', label: 'Últimos 6 meses' },
        { value: '365_dias', label: 'Último año' },
        { value: 'personalizado', label: 'Personalizado' }
    ];

    const tiposPeriodo = [
        { value: 'diario', label: 'Diario' },
        { value: 'mensual', label: 'Mensual' },
        { value: 'anual', label: 'Anual' }
    ];

    useEffect(() => {
        // Configurar fechas automáticamente según el período predefinido
        if (filtros.periodo_predefinido !== 'personalizado') {
            const hoy = new Date();
            const dias = parseInt(filtros.periodo_predefinido.split('_')[0]);
            const fechaInicio = new Date(hoy.getTime() - (dias * 24 * 60 * 60 * 1000));
            
            setFiltros(prev => ({
                ...prev,
                fecha_fin: hoy.toISOString().split('T')[0],
                fecha_inicio: fechaInicio.toISOString().split('T')[0]
            }));
        }
    }, [filtros.periodo_predefinido]);

    useEffect(() => {
        // Notificar cambios al componente padre
        if (onFiltersChange) {
            onFiltersChange(filtros);
        }
    }, [filtros, onFiltersChange]);

    const handleChange = (field, value) => {
        setFiltros(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const aplicarFiltros = () => {
        if (onFiltersChange) {
            onFiltersChange(filtros);
        }
    };

    return (
        <motion.div 
            className={style.dashboardFilters}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
        >
            <div className={style.filterSection}>
                <h3>Filtros Temporales</h3>
                
                <div className={style.filterRow}>
                    <div className={style.filterGroup}>
                        <label>Período Predefinido:</label>
                        <select 
                            value={filtros.periodo_predefinido}
                            onChange={(e) => handleChange('periodo_predefinido', e.target.value)}
                            disabled={isLoading}
                        >
                            {periodosPredefinidos.map(periodo => (
                                <option key={periodo.value} value={periodo.value}>
                                    {periodo.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className={style.filterGroup}>
                        <label>Agrupación:</label>
                        <select 
                            value={filtros.tipo_periodo}
                            onChange={(e) => handleChange('tipo_periodo', e.target.value)}
                            disabled={isLoading}
                        >
                            {tiposPeriodo.map(tipo => (
                                <option key={tipo.value} value={tipo.value}>
                                    {tipo.label}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {filtros.periodo_predefinido === 'personalizado' && (
                    <motion.div 
                        className={style.filterRow}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                    >
                        <div className={style.filterGroup}>
                            <label>Fecha Inicio:</label>
                            <input 
                                type="date"
                                value={filtros.fecha_inicio}
                                onChange={(e) => handleChange('fecha_inicio', e.target.value)}
                                disabled={isLoading}
                            />
                        </div>

                        <div className={style.filterGroup}>
                            <label>Fecha Fin:</label>
                            <input 
                                type="date"
                                value={filtros.fecha_fin}
                                onChange={(e) => handleChange('fecha_fin', e.target.value)}
                                disabled={isLoading}
                            />
                        </div>
                    </motion.div>
                )}

                <div className={style.filterActions}>
                    <button 
                        className={`btn btn-primary ${style.applyButton}`}
                        onClick={aplicarFiltros}
                        disabled={isLoading}
                    >
                        {isLoading ? 'Aplicando...' : 'Aplicar Filtros'}
                    </button>
                </div>
            </div>
        </motion.div>
    );
};

export default DashboardFilters;
