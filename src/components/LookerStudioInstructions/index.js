// src/components/LookerStudioInstructions/index.js
import { h } from 'preact';
import { useState } from 'preact/hooks';
import { motion, AnimatePresence } from 'framer-motion';
import style from './style.css';

const LookerStudioInstructions = ({ onClose, dashboardData }) => {
    const [activeStep, setActiveStep] = useState(0);
    
    const steps = [
        {
            title: "1. Preparar Datos",
            content: (
                <div>
                    <p>Los datos están disponibles a través de nuestra API REST:</p>
                    <div className={style.codeBlock}>
                        <code>GET {window.location.origin.replace('8080', '8000')}/api/dashboard-stats/</code>
                    </div>
                    <p>Parámetros disponibles:</p>
                    <ul>
                        <li><strong>fecha_inicio</strong>: Fecha inicio (ISO 8601)</li>
                        <li><strong>fecha_fin</strong>: Fecha fin (ISO 8601)</li>
                        <li><strong>tipo_periodo</strong>: diario | mensual | anual</li>
                    </ul>
                </div>
            )
        },
        {
            title: "2. Acceder a Looker Studio",
            content: (
                <div>
                    <p>Ir a Google Looker Studio:</p>
                    <a 
                        href="https://lookerstudio.google.com/" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className={style.link}
                    >
                        https://lookerstudio.google.com/
                    </a>
                    <p>1. Hacer clic en "Crear" → "Informe en blanco"</p>
                    <p>2. Seleccionar "Crear fuente de datos"</p>
                </div>
            )
        },
        {
            title: "3. Configurar Conector",
            content: (
                <div>
                    <p>Opciones para conectar los datos:</p>
                    <div className={style.optionCard}>
                        <h4>Opción A: Conector HTTP/REST (Recomendado)</h4>
                        <p>Usar el conector nativo de Google Sheets o crear un conector personalizado.</p>
                    </div>
                    <div className={style.optionCard}>
                        <h4>Opción B: Google Sheets</h4>
                        <p>Exportar datos a CSV e importar a Google Sheets como fuente intermedia.</p>
                        <button 
                            className="btn btn-outline-primary btn-sm"
                            onClick={() => exportToCSV()}
                        >
                            📥 Exportar CSV
                        </button>
                    </div>
                </div>
            )
        },
        {
            title: "4. Crear Visualizaciones",
            content: (
                <div>
                    <p>Tipos de gráficos recomendados:</p>
                    <div className={style.chartTypes}>
                        <div className={style.chartType}>
                            <strong>📊 Métricas KPI</strong>
                            <p>Usar tarjetas de puntuación para eficiencia, utilización, etc.</p>
                        </div>
                        <div className={style.chartType}>
                            <strong>📈 Tendencias</strong>
                            <p>Gráficos de líneas para evolución temporal</p>
                        </div>
                        <div className={style.chartType}>
                            <strong>🍕 Distribuciones</strong>
                            <p>Gráficos circulares para estados y tipos</p>
                        </div>
                        <div className={style.chartType}>
                            <strong>🗺️ Mapas</strong>
                            <p>Mapas geográficos para rutas y ubicaciones</p>
                        </div>
                    </div>
                </div>
            )
        },
        {
            title: "5. Configurar Filtros",
            content: (
                <div>
                    <p>Agregar controles de filtro para:</p>
                    <ul>
                        <li><strong>Rango de fechas</strong>: Control de fecha para análisis temporal</li>
                        <li><strong>Tipo de vehículo</strong>: Lista desplegable</li>
                        <li><strong>Estado</strong>: Filtro de estado de asignaciones</li>
                        <li><strong>Conductor</strong>: Selector múltiple</li>
                    </ul>
                    <p className={style.tip}>
                        💡 <strong>Tip:</strong> Usar filtros a nivel de página para que afecten todas las visualizaciones.
                    </p>
                </div>
            )
        }
    ];

    const exportToCSV = () => {
        if (!dashboardData) return;
        
        // Preparar datos para CSV
        const csvData = [];
        
        // Agregar encabezados
        csvData.push([
            'Fecha', 'Total_Asignaciones', 'Completadas', 'Canceladas', 
            'Vehiculo_Patente', 'Vehiculo_Tipo', 'Conductor_Nombre',
            'Distancia_KM', 'Estado_Flota'
        ]);
        
        // Agregar datos de tendencias
        if (dashboardData.tendencias) {
            dashboardData.tendencias.forEach(item => {
                csvData.push([
                    item.periodo,
                    item.total_asignaciones,
                    item.completadas,
                    item.canceladas,
                    '', '', '', '', ''
                ]);
            });
        }
        
        // Convertir a CSV
        const csvContent = csvData.map(row => row.join(',')).join('\n');
        
        // Crear y descargar archivo
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `dashboard_data_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <motion.div 
            className={style.overlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
        >
            <motion.div 
                className={style.modal}
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
            >
                <div className={style.header}>
                    <h2>📊 Configurar Google Looker Studio</h2>
                    <button 
                        className={style.closeButton}
                        onClick={onClose}
                    >
                        ✕
                    </button>
                </div>

                <div className={style.body}>
                    <div className={style.stepNavigation}>
                        {steps.map((step, index) => (
                            <button
                                key={index}
                                className={`${style.stepButton} ${activeStep === index ? style.active : ''}`}
                                onClick={() => setActiveStep(index)}
                            >
                                {step.title}
                            </button>
                        ))}
                    </div>

                    <div className={style.stepContent}>
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={activeStep}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.3 }}
                            >
                                <h3>{steps[activeStep].title}</h3>
                                {steps[activeStep].content}
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </div>

                <div className={style.footer}>
                    <div className={style.navigation}>
                        <button 
                            className="btn btn-outline-secondary"
                            onClick={() => setActiveStep(Math.max(0, activeStep - 1))}
                            disabled={activeStep === 0}
                        >
                            ← Anterior
                        </button>
                        
                        <span className={style.stepIndicator}>
                            {activeStep + 1} de {steps.length}
                        </span>
                        
                        <button 
                            className="btn btn-outline-primary"
                            onClick={() => setActiveStep(Math.min(steps.length - 1, activeStep + 1))}
                            disabled={activeStep === steps.length - 1}
                        >
                            Siguiente →
                        </button>
                    </div>
                    
                    <div className={style.actions}>
                        <a 
                            href="https://lookerstudio.google.com/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-primary"
                        >
                            🚀 Abrir Looker Studio
                        </a>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
};

export default LookerStudioInstructions;
