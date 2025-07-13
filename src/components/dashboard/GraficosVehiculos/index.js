// src/components/dashboard/GraficosVehiculos/index.js
import { h } from 'preact';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, BarElement, CategoryScale, LinearScale } from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';
import style from './style.css';

// Registrar componentes de Chart.js
ChartJS.register(ArcElement, Tooltip, Legend, BarElement, CategoryScale, LinearScale);

const GraficosVehiculos = ({ vehiculos }) => {
    // Datos para gráfico de estado de vehículos
    const estadosData = {
        labels: ['Disponibles', 'En Uso', 'Mantenimiento', 'Reservados'],
        datasets: [{
            data: [
                vehiculos.filter(v => v.estado === 'disponible').length,
                vehiculos.filter(v => v.estado === 'en_uso').length,
                vehiculos.filter(v => v.estado === 'mantenimiento').length,
                vehiculos.filter(v => v.estado === 'reservado').length,
            ],
            backgroundColor: [
                '#10B981', // Verde - Disponibles
                '#3B82F6', // Azul - En Uso
                '#F59E0B', // Amarillo - Mantenimiento
                '#8B5CF6'  // Púrpura - Reservados
            ],
            borderWidth: 2,
            borderColor: '#ffffff'
        }]
    };

    // Datos para gráfico de estado de mantenimiento
    const mantenimientoData = {
        labels: ['Bueno', 'Atención', 'Crítico'],
        datasets: [{
            data: [
                vehiculos.filter(v => v.estadoMantenimiento === 'bueno').length,
                vehiculos.filter(v => v.estadoMantenimiento === 'atencion').length,
                vehiculos.filter(v => v.estadoMantenimiento === 'critico').length,
            ],
            backgroundColor: [
                '#10B981', // Verde - Bueno
                '#F59E0B', // Amarillo - Atención
                '#EF4444'  // Rojo - Crítico
            ],
            borderWidth: 2,
            borderColor: '#ffffff'
        }]
    };

    // Datos para gráfico de tipos de vehículo
    const tiposVehiculo = [...new Set(vehiculos.map(v => v.tipo_vehiculo))].filter(Boolean);
    const tiposData = {
        labels: tiposVehiculo.map(tipo => tipo.charAt(0).toUpperCase() + tipo.slice(1)),
        datasets: [{
            label: 'Cantidad de Vehículos',
            data: tiposVehiculo.map(tipo => 
                vehiculos.filter(v => v.tipo_vehiculo === tipo).length
            ),
            backgroundColor: [
                '#3B82F6',
                '#10B981',
                '#F59E0B',
                '#EF4444',
                '#8B5CF6',
                '#EC4899'
            ],
            borderWidth: 1,
            borderColor: '#ffffff'
        }]
    };

    // Datos para gráfico de utilización
    const utilizacionRangos = [
        { label: '0-25%', min: 0, max: 25 },
        { label: '26-50%', min: 26, max: 50 },
        { label: '51-75%', min: 51, max: 75 },
        { label: '76-100%', min: 76, max: 100 }
    ];

    const utilizacionData = {
        labels: utilizacionRangos.map(r => r.label),
        datasets: [{
            label: 'Vehículos por Utilización',
            data: utilizacionRangos.map(rango => 
                vehiculos.filter(v => 
                    v.utilizacion >= rango.min && v.utilizacion <= rango.max
                ).length
            ),
            backgroundColor: [
                '#EF4444', // Rojo - Baja utilización
                '#F59E0B', // Amarillo - Utilización media-baja
                '#10B981', // Verde - Utilización media-alta
                '#3B82F6'  // Azul - Alta utilización
            ],
            borderWidth: 1,
            borderColor: '#ffffff'
        }]
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'bottom',
                labels: {
                    padding: 15,
                    usePointStyle: true
                }
            }
        }
    };

    const barChartOptions = {
        ...chartOptions,
        scales: {
            y: {
                beginAtZero: true,
                ticks: {
                    stepSize: 1
                }
            }
        }
    };

    if (vehiculos.length === 0) {
        return (
            <div className={style.noData}>
                <p>No hay datos suficientes para mostrar gráficos</p>
            </div>
        );
    }

    return (
        <div className={style.graficosContainer}>
            <div className={style.graficosGrid}>
                {/* Estado de vehículos */}
                <div className={style.graficoCard}>
                    <h4>Estado de Vehículos</h4>
                    <div className={style.graficoWrapper}>
                        <Pie data={estadosData} options={chartOptions} />
                    </div>
                    <div className={style.graficoStats}>
                        <div className={style.statItem}>
                            <span className={style.statValue}>
                                {((vehiculos.filter(v => v.estado === 'disponible').length / vehiculos.length) * 100).toFixed(1)}%
                            </span>
                            <span className={style.statLabel}>Disponibilidad</span>
                        </div>
                    </div>
                </div>

                {/* Estado de mantenimiento */}
                <div className={style.graficoCard}>
                    <h4>Estado de Mantenimiento</h4>
                    <div className={style.graficoWrapper}>
                        <Pie data={mantenimientoData} options={chartOptions} />
                    </div>
                    <div className={style.graficoStats}>
                        <div className={style.statItem}>
                            <span className={style.statValue}>
                                {vehiculos.filter(v => v.estadoMantenimiento === 'critico').length}
                            </span>
                            <span className={style.statLabel}>Críticos</span>
                        </div>
                    </div>
                </div>

                {/* Tipos de vehículo */}
                <div className={style.graficoCard}>
                    <h4>Distribución por Tipo</h4>
                    <div className={style.graficoWrapper}>
                        <Bar data={tiposData} options={barChartOptions} />
                    </div>
                    <div className={style.graficoStats}>
                        <div className={style.statItem}>
                            <span className={style.statValue}>{tiposVehiculo.length}</span>
                            <span className={style.statLabel}>Tipos diferentes</span>
                        </div>
                    </div>
                </div>

                {/* Utilización */}
                <div className={style.graficoCard}>
                    <h4>Utilización (últimos 30 días)</h4>
                    <div className={style.graficoWrapper}>
                        <Bar data={utilizacionData} options={barChartOptions} />
                    </div>
                    <div className={style.graficoStats}>
                        <div className={style.statItem}>
                            <span className={style.statValue}>
                                {(vehiculos.reduce((sum, v) => sum + v.utilizacion, 0) / vehiculos.length).toFixed(1)}%
                            </span>
                            <span className={style.statLabel}>Promedio</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Métricas adicionales */}
            <div className={style.metricsRow}>
                <div className={style.metricCard}>
                    <div className={style.metricIcon}>🛣️</div>
                    <div className={style.metricContent}>
                        <div className={style.metricValue}>
                            {vehiculos.reduce((sum, v) => sum + (v.kmRecorridos || 0), 0).toLocaleString()} km
                        </div>
                        <div className={style.metricLabel}>Kilómetros totales recorridos</div>
                    </div>
                </div>

                <div className={style.metricCard}>
                    <div className={style.metricIcon}>📋</div>
                    <div className={style.metricContent}>
                        <div className={style.metricValue}>
                            {vehiculos.reduce((sum, v) => sum + (v.totalAsignaciones || 0), 0)}
                        </div>
                        <div className={style.metricLabel}>Asignaciones totales</div>
                    </div>
                </div>

                <div className={style.metricCard}>
                    <div className={style.metricIcon}>⚡</div>
                    <div className={style.metricContent}>
                        <div className={style.metricValue}>
                            {vehiculos.filter(v => v.utilizacion > 75).length}
                        </div>
                        <div className={style.metricLabel}>Vehículos alta utilización</div>
                    </div>
                </div>

                <div className={style.metricCard}>
                    <div className={style.metricIcon}>🔧</div>
                    <div className={style.metricContent}>
                        <div className={style.metricValue}>
                            {vehiculos.filter(v => v.kmParaMantenimiento < 1000).length}
                        </div>
                        <div className={style.metricLabel}>Próximos a mantenimiento</div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GraficosVehiculos;
