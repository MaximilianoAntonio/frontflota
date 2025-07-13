// src/components/dashboard/GraficosConductores/index.js
import { h } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    LineElement,
    PointElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    Filler
} from 'chart.js';
import { Pie, Bar, Line } from 'react-chartjs-2';
import style from './style.css';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    LineElement,
    PointElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

const GraficosConductores = ({ conductores }) => {
    const [metricas, setMetricas] = useState({});
    const [vista, setVista] = useState('resumen'); // 'resumen', 'rendimiento', 'licencias'

    useEffect(() => {
        const calcularMetricas = () => {
            if (conductores.length === 0) return;

            // Distribución por estado de disponibilidad
            const estadosDisponibilidad = {};
            conductores.forEach(conductor => {
                const estado = conductor.estado_disponibilidad || 'sin_estado';
                estadosDisponibilidad[estado] = (estadosDisponibilidad[estado] || 0) + 1;
            });

            // Distribución por estado de licencia
            const estadosLicencia = {};
            conductores.forEach(conductor => {
                const estado = conductor.estadoLicencia || 'sin_estado';
                estadosLicencia[estado] = (estadosLicencia[estado] || 0) + 1;
            });

            // Niveles de disponibilidad
            const nivelesDisponibilidad = { alta: 0, media: 0, baja: 0 };
            conductores.forEach(conductor => {
                if (conductor.disponibilidadPorcentaje >= 75) {
                    nivelesDisponibilidad.alta++;
                } else if (conductor.disponibilidadPorcentaje >= 50) {
                    nivelesDisponibilidad.media++;
                } else {
                    nivelesDisponibilidad.baja++;
                }
            });

            // Distribución de eficiencia
            const rangosEficiencia = { alta: 0, media: 0, baja: 0 };
            conductores.forEach(conductor => {
                if (conductor.tasaEficiencia >= 80) {
                    rangosEficiencia.alta++;
                } else if (conductor.tasaEficiencia >= 60) {
                    rangosEficiencia.media++;
                } else {
                    rangosEficiencia.baja++;
                }
            });

            // Promedios generales
            const totalConductores = conductores.length;
            const promedioEficiencia = conductores.reduce((sum, c) => sum + c.tasaEficiencia, 0) / totalConductores;
            const promedioDiasTrabajados = conductores.reduce((sum, c) => sum + c.diasTrabajados30, 0) / totalConductores;
            const promedioKmRecorridos = conductores.reduce((sum, c) => sum + c.kmRecorridos30, 0) / totalConductores;
            const promedioTiempoAsignacion = conductores.reduce((sum, c) => sum + c.tiempoPromedioAsignacion, 0) / totalConductores;

            // Top 5 conductores por eficiencia
            const topEficiencia = [...conductores]
                .sort((a, b) => b.tasaEficiencia - a.tasaEficiencia)
                .slice(0, 5);

            // Top 5 conductores por kilómetros
            const topKilometros = [...conductores]
                .sort((a, b) => b.kmRecorridos30 - a.kmRecorridos30)
                .slice(0, 5);

            // Distribución de días trabajados
            const diasTrabajadosDistribucion = { '0-10': 0, '11-20': 0, '21-30': 0 };
            conductores.forEach(conductor => {
                const dias = conductor.diasTrabajados30;
                if (dias <= 10) {
                    diasTrabajadosDistribucion['0-10']++;
                } else if (dias <= 20) {
                    diasTrabajadosDistribucion['11-20']++;
                } else {
                    diasTrabajadosDistribucion['21-30']++;
                }
            });

            setMetricas({
                estadosDisponibilidad,
                estadosLicencia,
                nivelesDisponibilidad,
                rangosEficiencia,
                promedios: {
                    eficiencia: parseFloat(promedioEficiencia.toFixed(1)),
                    diasTrabajados: parseFloat(promedioDiasTrabajados.toFixed(1)),
                    kmRecorridos: parseFloat(promedioKmRecorridos.toFixed(1)),
                    tiempoAsignacion: parseFloat(promedioTiempoAsignacion.toFixed(2))
                },
                topEficiencia,
                topKilometros,
                diasTrabajadosDistribucion,
                totalConductores
            });
        };

        calcularMetricas();
    }, [conductores]);

    // Configuraciones de gráficos
    const opcionesComunes = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'bottom',
                labels: {
                    padding: 20,
                    usePointStyle: true,
                    font: {
                        size: 12
                    }
                }
            }
        }
    };

    // Datos para gráfico de estados de disponibilidad (Pie)
    const datosEstadosDisponibilidad = {
        labels: Object.keys(metricas.estadosDisponibilidad || {}).map(estado => 
            estado.replace('_', ' ').toUpperCase()
        ),
        datasets: [{
            data: Object.values(metricas.estadosDisponibilidad || {}),
            backgroundColor: [
                '#28a745', // disponible
                '#ffc107', // ocupado
                '#007bff', // en_ruta
                '#dc3545'  // no_disponible
            ],
            borderWidth: 2,
            borderColor: '#fff'
        }]
    };

    // Datos para gráfico de licencias (Pie)
    const datosEstadosLicencia = {
        labels: Object.keys(metricas.estadosLicencia || {}).map(estado => 
            estado.replace('_', ' ').toUpperCase()
        ),
        datasets: [{
            data: Object.values(metricas.estadosLicencia || {}),
            backgroundColor: [
                '#28a745', // vigente
                '#ffc107', // por_vencer
                '#dc3545'  // vencida
            ],
            borderWidth: 2,
            borderColor: '#fff'
        }]
    };

    // Datos para gráfico de niveles de disponibilidad (Bar)
    const datosNivelesDisponibilidad = {
        labels: ['Alta (≥75%)', 'Media (50-74%)', 'Baja (<50%)'],
        datasets: [{
            label: 'Conductores por Nivel',
            data: [
                metricas.nivelesDisponibilidad?.alta || 0,
                metricas.nivelesDisponibilidad?.media || 0,
                metricas.nivelesDisponibilidad?.baja || 0
            ],
            backgroundColor: ['#28a745', '#ffc107', '#dc3545'],
            borderColor: ['#1e7e34', '#e0a800', '#c82333'],
            borderWidth: 1
        }]
    };

    // Datos para gráfico de eficiencia (Bar)
    const datosRangosEficiencia = {
        labels: ['Alta (≥80%)', 'Media (60-79%)', 'Baja (<60%)'],
        datasets: [{
            label: 'Conductores por Eficiencia',
            data: [
                metricas.rangosEficiencia?.alta || 0,
                metricas.rangosEficiencia?.media || 0,
                metricas.rangosEficiencia?.baja || 0
            ],
            backgroundColor: ['#28a745', '#ffc107', '#dc3545'],
            borderColor: ['#1e7e34', '#e0a800', '#c82333'],
            borderWidth: 1
        }]
    };

    // Datos para top conductores por eficiencia (Bar horizontal)
    const datosTopEficiencia = {
        labels: (metricas.topEficiencia || []).map(c => `${c.nombre} ${c.apellido}`),
        datasets: [{
            label: 'Eficiencia (%)',
            data: (metricas.topEficiencia || []).map(c => c.tasaEficiencia),
            backgroundColor: '#2c5aa0',
            borderColor: '#1a4480',
            borderWidth: 1
        }]
    };

    // Datos para top conductores por kilómetros (Bar horizontal)
    const datosTopKilometros = {
        labels: (metricas.topKilometros || []).map(c => `${c.nombre} ${c.apellido}`),
        datasets: [{
            label: 'Kilómetros Recorridos',
            data: (metricas.topKilometros || []).map(c => c.kmRecorridos30),
            backgroundColor: '#17a2b8',
            borderColor: '#138496',
            borderWidth: 1
        }]
    };

    const opcionesBarHorizontal = {
        ...opcionesComunes,
        indexAxis: 'y',
        scales: {
            x: {
                beginAtZero: true,
                grid: {
                    color: '#e9ecef'
                }
            },
            y: {
                grid: {
                    display: false
                }
            }
        }
    };

    if (!metricas.totalConductores) {
        return (
            <div className={style.loadingContainer}>
                <div className={style.spinner}></div>
                <p>Procesando datos de conductores...</p>
            </div>
        );
    }

    return (
        <div className={style.graficosContainer}>
            {/* Tabs de navegación */}
            <div className={style.tabsContainer}>
                <button
                    onClick={() => setVista('resumen')}
                    className={`${style.tab} ${vista === 'resumen' ? style.tabActiva : ''}`}
                >
                    📊 Resumen General
                </button>
                <button
                    onClick={() => setVista('rendimiento')}
                    className={`${style.tab} ${vista === 'rendimiento' ? style.tabActiva : ''}`}
                >
                    🎯 Rendimiento
                </button>
                <button
                    onClick={() => setVista('licencias')}
                    className={`${style.tab} ${vista === 'licencias' ? style.tabActiva : ''}`}
                >
                    📋 Licencias
                </button>
            </div>

            {/* Métricas generales */}
            <div className={style.metricsRow}>
                <div className={style.metricCard}>
                    <div className={style.metricValue}>{metricas.promedios.eficiencia}%</div>
                    <div className={style.metricLabel}>Eficiencia Promedio</div>
                </div>
                <div className={style.metricCard}>
                    <div className={style.metricValue}>{metricas.promedios.diasTrabajados}</div>
                    <div className={style.metricLabel}>Días Trabajados Promedio</div>
                </div>
                <div className={style.metricCard}>
                    <div className={style.metricValue}>{metricas.promedios.kmRecorridos} km</div>
                    <div className={style.metricLabel}>Km Promedio (30d)</div>
                </div>
                <div className={style.metricCard}>
                    <div className={style.metricValue}>{metricas.promedios.tiempoAsignacion}h</div>
                    <div className={style.metricLabel}>Tiempo Promedio</div>
                </div>
            </div>

            {/* Contenido según vista seleccionada */}
            {vista === 'resumen' && (
                <div className={style.chartsGrid}>
                    <div className={style.chartCard}>
                        <h4>Estados de Disponibilidad</h4>
                        <div className={style.chartContainer}>
                            <Pie data={datosEstadosDisponibilidad} options={opcionesComunes} />
                        </div>
                    </div>

                    <div className={style.chartCard}>
                        <h4>Niveles de Disponibilidad</h4>
                        <div className={style.chartContainer}>
                            <Bar data={datosNivelesDisponibilidad} options={opcionesComunes} />
                        </div>
                    </div>

                    <div className={style.chartCard}>
                        <h4>Rangos de Eficiencia</h4>
                        <div className={style.chartContainer}>
                            <Bar data={datosRangosEficiencia} options={opcionesComunes} />
                        </div>
                    </div>

                    <div className={style.chartCard}>
                        <h4>Estados de Licencias</h4>
                        <div className={style.chartContainer}>
                            <Pie data={datosEstadosLicencia} options={opcionesComunes} />
                        </div>
                    </div>
                </div>
            )}

            {vista === 'rendimiento' && (
                <div className={style.chartsGrid}>
                    <div className={style.chartCard}>
                        <h4>Top 5 Conductores - Eficiencia</h4>
                        <div className={style.chartContainer}>
                            <Bar data={datosTopEficiencia} options={opcionesBarHorizontal} />
                        </div>
                    </div>

                    <div className={style.chartCard}>
                        <h4>Top 5 Conductores - Kilómetros</h4>
                        <div className={style.chartContainer}>
                            <Bar data={datosTopKilometros} options={opcionesBarHorizontal} />
                        </div>
                    </div>

                    <div className={style.chartCard}>
                        <h4>Distribución Días Trabajados</h4>
                        <div className={style.chartContainer}>
                            <Bar 
                                data={{
                                    labels: ['0-10 días', '11-20 días', '21-30 días'],
                                    datasets: [{
                                        label: 'Conductores',
                                        data: [
                                            metricas.diasTrabajadosDistribucion?.['0-10'] || 0,
                                            metricas.diasTrabajadosDistribucion?.['11-20'] || 0,
                                            metricas.diasTrabajadosDistribucion?.['21-30'] || 0
                                        ],
                                        backgroundColor: ['#dc3545', '#ffc107', '#28a745'],
                                        borderColor: ['#c82333', '#e0a800', '#1e7e34'],
                                        borderWidth: 1
                                    }]
                                }}
                                options={opcionesComunes}
                            />
                        </div>
                    </div>

                    <div className={style.chartCard}>
                        <h4>Resumen de Rendimiento</h4>
                        <div className={style.summaryStats}>
                            <div className={style.summaryItem}>
                                <span className={style.summaryLabel}>Conductores Activos:</span>
                                <span className={style.summaryValue}>
                                    {conductores.filter(c => c.diasTrabajados30 > 0).length}
                                </span>
                            </div>
                            <div className={style.summaryItem}>
                                <span className={style.summaryLabel}>Alta Eficiencia (≥80%):</span>
                                <span className={style.summaryValue}>
                                    {metricas.rangosEficiencia?.alta || 0} conductores
                                </span>
                            </div>
                            <div className={style.summaryItem}>
                                <span className={style.summaryLabel}>Total Km Recorridos:</span>
                                <span className={style.summaryValue}>
                                    {conductores.reduce((sum, c) => sum + c.kmRecorridos30, 0).toFixed(0)} km
                                </span>
                            </div>
                            <div className={style.summaryItem}>
                                <span className={style.summaryLabel}>Total Asignaciones:</span>
                                <span className={style.summaryValue}>
                                    {conductores.reduce((sum, c) => sum + c.asignacionesCompletadasPeriodo30, 0)}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {vista === 'licencias' && (
                <div className={style.chartsGrid}>
                    <div className={style.chartCard}>
                        <h4>Estados de Licencias</h4>
                        <div className={style.chartContainer}>
                            <Pie data={datosEstadosLicencia} options={opcionesComunes} />
                        </div>
                    </div>

                    <div className={style.chartCard}>
                        <h4>Alertas de Licencias</h4>
                        <div className={style.licenseAlerts}>
                            <div className={style.alertItem}>
                                <span className={style.alertIcon}>⚠️</span>
                                <div className={style.alertContent}>
                                    <div className={style.alertTitle}>Licencias por Vencer</div>
                                    <div className={style.alertCount}>
                                        {conductores.filter(c => c.estadoLicencia === 'por_vencer').length} conductores
                                    </div>
                                    <div className={style.alertDetail}>
                                        Vencen en los próximos 30 días
                                    </div>
                                </div>
                            </div>

                            <div className={style.alertItem}>
                                <span className={style.alertIcon}>❌</span>
                                <div className={style.alertContent}>
                                    <div className={style.alertTitle}>Licencias Vencidas</div>
                                    <div className={style.alertCount}>
                                        {conductores.filter(c => c.estadoLicencia === 'vencida').length} conductores
                                    </div>
                                    <div className={style.alertDetail}>
                                        Requieren renovación inmediata
                                    </div>
                                </div>
                            </div>

                            <div className={style.alertItem}>
                                <span className={style.alertIcon}>✅</span>
                                <div className={style.alertContent}>
                                    <div className={style.alertTitle}>Licencias Vigentes</div>
                                    <div className={style.alertCount}>
                                        {conductores.filter(c => c.estadoLicencia === 'vigente').length} conductores
                                    </div>
                                    <div className={style.alertDetail}>
                                        En regla y operativas
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className={style.chartCard}>
                        <h4>Próximos Vencimientos</h4>
                        <div className={style.expiringList}>
                            {conductores
                                .filter(c => c.estadoLicencia === 'por_vencer')
                                .sort((a, b) => a.diasParaVencimientoLicencia - b.diasParaVencimientoLicencia)
                                .slice(0, 10)
                                .map(conductor => (
                                    <div key={conductor.id} className={style.expiringItem}>
                                        <div className={style.conductorName}>
                                            {conductor.nombre} {conductor.apellido}
                                        </div>
                                        <div className={style.expiringDays}>
                                            {conductor.diasParaVencimientoLicencia} días
                                        </div>
                                    </div>
                                ))
                            }
                            {conductores.filter(c => c.estadoLicencia === 'por_vencer').length === 0 && (
                                <div className={style.noExpiring}>
                                    No hay licencias próximas a vencer
                                </div>
                            )}
                        </div>
                    </div>

                    <div className={style.chartCard}>
                        <h4>Estadísticas de Licencias</h4>
                        <div className={style.licenseStats}>
                            <div className={style.licenseStatItem}>
                                <div className={style.statNumber}>
                                    {((conductores.filter(c => c.estadoLicencia === 'vigente').length / conductores.length) * 100).toFixed(1)}%
                                </div>
                                <div className={style.statLabel}>Licencias Vigentes</div>
                            </div>
                            <div className={style.licenseStatItem}>
                                <div className={style.statNumber}>
                                    {conductores.filter(c => c.diasParaVencimientoLicencia <= 7 && c.diasParaVencimientoLicencia > 0).length}
                                </div>
                                <div className={style.statLabel}>Vencen en 7 días</div>
                            </div>
                            <div className={style.licenseStatItem}>
                                <div className={style.statNumber}>
                                    {conductores.filter(c => c.diasParaVencimientoLicencia <= 30 && c.diasParaVencimientoLicencia > 7).length}
                                </div>
                                <div className={style.statLabel}>Vencen en 30 días</div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GraficosConductores;
