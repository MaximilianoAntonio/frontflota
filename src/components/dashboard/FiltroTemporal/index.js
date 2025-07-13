// src/components/dashboard/FiltroTemporal/index.js
import { h } from 'preact';
import { useState } from 'preact/hooks';
import style from './style.css';

const FiltroTemporal = ({ filtro, onChange }) => {
    const [showCustom, setShowCustom] = useState(filtro.periodo === 'custom');
    const [tempFechas, setTempFechas] = useState({
        fecha_inicio: filtro.fecha_inicio || '',
        fecha_fin: filtro.fecha_fin || ''
    });

    const periodos = [
        { value: 'daily', label: 'Hoy' },
        { value: 'weekly', label: 'Esta semana' },
        { value: 'monthly', label: 'Este mes' },
        { value: 'quarterly', label: 'Este trimestre' },
        { value: 'yearly', label: 'Este año' },
        { value: 'custom', label: 'Rango personalizado' }
    ];

    const handlePeriodoChange = (nuevoPeriodo) => {
        setShowCustom(nuevoPeriodo === 'custom');
        
        if (nuevoPeriodo !== 'custom') {
            onChange({
                periodo: nuevoPeriodo,
                fecha_inicio: null,
                fecha_fin: null
            });
        } else {
            // Establecer fechas por defecto para el rango personalizado
            const hoy = new Date();
            const hace30Dias = new Date();
            hace30Dias.setDate(hoy.getDate() - 30);
            
            const fechaInicio = hace30Dias.toISOString().split('T')[0];
            const fechaFin = hoy.toISOString().split('T')[0];
            
            setTempFechas({
                fecha_inicio: fechaInicio,
                fecha_fin: fechaFin
            });
            
            onChange({
                periodo: 'custom',
                fecha_inicio: fechaInicio,
                fecha_fin: fechaFin
            });
        }
    };

    const handleFechaChange = (campo, valor) => {
        const nuevasFechas = {
            ...tempFechas,
            [campo]: valor
        };
        setTempFechas(nuevasFechas);
        
        // Solo actualizar si ambas fechas están presentes
        if (nuevasFechas.fecha_inicio && nuevasFechas.fecha_fin) {
            onChange({
                periodo: 'custom',
                ...nuevasFechas
            });
        }
    };

    const aplicarFiltroCustom = () => {
        if (tempFechas.fecha_inicio && tempFechas.fecha_fin) {
            if (new Date(tempFechas.fecha_inicio) <= new Date(tempFechas.fecha_fin)) {
                onChange({
                    periodo: 'custom',
                    ...tempFechas
                });
            } else {
                alert('La fecha de inicio debe ser anterior a la fecha de fin');
            }
        } else {
            alert('Por favor seleccione ambas fechas');
        }
    };

    return (
        <div className={style.filtroTemporal}>
            <div className={style.selectorPeriodo}>
                <label className={style.label}>Período de análisis:</label>
                <select 
                    value={filtro.periodo}
                    onChange={(e) => handlePeriodoChange(e.target.value)}
                    className={style.select}
                >
                    {periodos.map(periodo => (
                        <option key={periodo.value} value={periodo.value}>
                            {periodo.label}
                        </option>
                    ))}
                </select>
            </div>

            {showCustom && (
                <div className={style.rangoCustom}>
                    <div className={style.fechaGroup}>
                        <label className={style.labelFecha}>Desde:</label>
                        <input
                            type="date"
                            value={tempFechas.fecha_inicio}
                            onChange={(e) => handleFechaChange('fecha_inicio', e.target.value)}
                            className={style.inputFecha}
                            max={new Date().toISOString().split('T')[0]}
                        />
                    </div>
                    
                    <div className={style.fechaGroup}>
                        <label className={style.labelFecha}>Hasta:</label>
                        <input
                            type="date"
                            value={tempFechas.fecha_fin}
                            onChange={(e) => handleFechaChange('fecha_fin', e.target.value)}
                            className={style.inputFecha}
                            min={tempFechas.fecha_inicio}
                            max={new Date().toISOString().split('T')[0]}
                        />
                    </div>
                    
                    {tempFechas.fecha_inicio && tempFechas.fecha_fin && (
                        <button 
                            onClick={aplicarFiltroCustom}
                            className={style.aplicarButton}
                        >
                            Aplicar
                        </button>
                    )}
                </div>
            )}

            {filtro.periodo === 'custom' && filtro.fecha_inicio && filtro.fecha_fin && (
                <div className={style.rangoActivo}>
                    <span className={style.rangoTexto}>
                        📅 {new Date(filtro.fecha_inicio).toLocaleDateString()} - {new Date(filtro.fecha_fin).toLocaleDateString()}
                    </span>
                </div>
            )}
        </div>
    );
};

export default FiltroTemporal;
