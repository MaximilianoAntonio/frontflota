// src/components/dashboard/VistaGeneral/index.js
import { h } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, LineElement, PointElement, LinearScale, CategoryScale } from 'chart.js';
import { Pie, Line } from 'react-chartjs-2';
import { formatChartData, getSystemAlerts } from '../../../services/dashboardService';
import { getVehiculos } from '../../../services/vehicleService';
import { getConductores } from '../../../services/conductorService';
import { getAsignaciones } from '../../../services/asignacionService';
import MetricCard from '../MetricCard';
import AlertasList from '../AlertasList';
import style from './style.css';

// Registrar componentes de Chart.js
ChartJS.register(ArcElement, Tooltip, Legend, LineElement, PointElement, LinearScale, CategoryScale);

const VistaGeneral = ({ data, loading }) => {
    const [alertas, setAlertas] = useState([]);
    const [vehiculosData, setVehiculosData] = useState([]);
    const [conductoresData, setConductoresData] = useState([]);
    const [asignacionesData, setAsignacionesData] = useState([]);
    const [loadingData, setLoadingData] = useState(true);

    useEffect(() => {
        const cargarDatosAdicionales = async () => {
            try {
                setLoadingData(true);
                const [vehiculos, conductores, asignaciones, alertasData] = await Promise.all([
                    getVehiculos(),
                    getConductores(),
                    getAsignaciones(),
                    getSystemAlerts()
                ]);
                
                setVehiculosData(vehiculos);
                setConductoresData(conductores);
                setAsignacionesData(asignaciones);
                setAlertas(alertasData);
            } catch (error) {
                console.error('Error cargando datos adicionales:', error);
            } finally {
                setLoadingData(false);
            }
        };

        cargarDatosAdicionales();
    }, []);

    // Datos simulados para gráficos de tendencias
    const datosTendencias = {
        labels: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'],
        datasets: [
            {
                label: 'Asignaciones Completadas',
                data: [12, 19, 15, 22, 18, 8, 14],
                borderColor: '#10b981',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                tension: 0.4,
                fill: true
            },
            {
                label: 'Km Recorridos',
                data: [180, 290, 220, 340, 260, 120, 200],
                borderColor: '#3b82f6',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                tension: 0.4,
                fill: true,
                yAxisID: 'y1'
            }
        ]
    };

    const opcionesTendencias = {
        responsive: true,
        interaction: {
            mode: 'index',
            intersect: false,
        },
        scales: {
            y: {
                type: 'linear',
                display: true,
                position: 'left',
                title: {
                    display: true,
                    text: 'Asignaciones'
                }
            },
            y1: {
                type: 'linear',
                display: true,
                position: 'right',
                title: {
                    display: true,
                    text: 'Kilómetros'
                },
                grid: {
                    drawOnChartArea: false,
                },
            },
        },
        plugins: {
            legend: {
                position: 'top',
            },
            title: {
                display: true,
                text: 'Tendencias Semanales'
            }
        }
    };

    if (loading || loadingData) {
        return (
            <div className={style.loadingContainer}>
                <div className={style.spinner}></div>
                <p>Cargando vista general...</p>
            </div>
        );
    }

    // Calcular métricas en tiempo real de los datos obtenidos
    const vehiculosDisponibles = vehiculosData.filter(v => v.estado === 'disponible').length;
    const vehiculosEnUso = vehiculosData.filter(v => v.estado === 'en_uso').length;
    const vehiculosMantenimiento = vehiculosData.filter(v => v.estado === 'mantenimiento').length;
    const vehiculosReservados = vehiculosData.filter(v => v.estado === 'reservado').length;

    const conductoresDisponibles = conductoresData.filter(c => c.estado_disponibilidad === 'disponible').length;
    const conductoresEnRuta = conductoresData.filter(c => c.estado_disponibilidad === 'en_ruta').length;

    const asignacionesCompletadas = asignacionesData.filter(a => a.estado === 'completada').length;
    const asignacionesActivas = asignacionesData.filter(a => a.estado === 'activa').length;
    const asignacionesProgramadas = asignacionesData.filter(a => a.estado === 'programada').length;

    const tasaUtilizacion = vehiculosData.length > 0 
        ? ((vehiculosEnUso + vehiculosReservados) / vehiculosData.length * 100).toFixed(1)
        : 0;

    const eficienciaAsignaciones = asignacionesData.length > 0
        ? (asignacionesCompletadas / asignacionesData.length * 100).toFixed(1)
        : 0;

    const kmTotales = asignacionesData
        .reduce((sum, a) => sum + (a.distancia_recorrida_km || 0), 0)
        .toFixed(1);

    // Datos para gráficos
    const chartDataVehiculos = {
        labels: ['Disponibles', 'En Uso', 'Mantenimiento', 'Reservados'],
        datasets: [{
            data: [vehiculosDisponibles, vehiculosEnUso, vehiculosMantenimiento, vehiculosReservados],
            backgroundColor: ['#10B981', '#3B82F6', '#F59E0B', '#8B5CF6'],
            borderWidth: 2,
            borderColor: '#ffffff'
        }]
    };

    const chartDataConductores = {
        labels: ['Disponibles', 'En Ruta', 'Día Libre', 'No Disponibles'],
        datasets: [{
            data: [
                conductoresDisponibles,
                conductoresEnRuta,
                conductoresData.filter(c => c.estado_disponibilidad === 'dia_libre').length,
                conductoresData.filter(c => c.estado_disponibilidad === 'no_disponible').length
            ],
            backgroundColor: ['#10B981', '#3B82F6', '#6B7280', '#EF4444'],
            borderWidth: 2,
            borderColor: '#ffffff'
        }]
    };

    return (
        <div className={style.vistaGeneral}>
            {/* Métricas principales */}
            <div className={style.metricsGrid}>
                <MetricCard
                    title="Flota Total"
                    value={vehiculosData.length}
                    subtitle={`${tasaUtilizacion}% en uso`}
                    icon="🚗"
                    trend={{ value: '+5%', direction: 'up' }}
                    color="blue"
                />
                
                <MetricCard
                    title="Conductores Activos"
                    value={conductoresDisponibles + conductoresEnRuta}
                    subtitle={`${conductoresData.length} total`}
                    icon="👨‍💼"
                    trend={{ value: '+2%', direction: 'up' }}
                    color="green"
                />
                
                <MetricCard
                    title="Asignaciones Hoy"
                    value={asignacionesData.length}
                    subtitle={`${eficienciaAsignaciones}% completadas`}
                    icon="📋"
                    trend={{ value: '+12%', direction: 'up' }}
                    color="purple"
                />
                
                <MetricCard
                    title="Km Recorridos"
                    value={kmTotales}
                    subtitle="kilómetros totales"
                    icon="🛣️"
                    trend={{ value: '+8%', direction: 'up' }}
                    color="orange"
                />
            </div>

            {/* Gráficos y análisis */}
            <div className={style.chartsGrid}>
                {/* Estado de vehículos */}
                <div className={style.chartCard}>
                    <h3>Estado de la Flota</h3>
                    <div className={style.chartContainer}>
                        <Pie 
                            data={chartDataVehiculos}
                            options={{
                                responsive: true,
                                maintainAspectRatio: false,
                                plugins: {
                                    legend: {
                                        position: 'bottom'
                                    }
                                }
                            }}
                        />
                    </div>
                </div>

                {/* Estado de conductores */}
                <div className={style.chartCard}>
                    <h3>Estado de Conductores</h3>
                    <div className={style.chartContainer}>
                        <Pie 
                            data={chartDataConductores}
                            options={{
                                responsive: true,
                                maintainAspectRatio: false,
                                plugins: {
                                    legend: {
                                        position: 'bottom'
                                    }
                                }
                            }}
                        />
                    </div>
                </div>

                {/* Tendencias */}
                <div className={`${style.chartCard} ${style.wideChart}`}>
                    <h3>Tendencias de Actividad</h3>
                    <div className={style.chartContainer}>
                        <Line 
                            data={datosTendencias}
                            options={opcionesTendencias}
                        />
                    </div>
                </div>
            </div>

            {/* Alertas y notificaciones */}
            <div className={style.alertasSection}>
                <AlertasList alertas={alertas} />
            </div>

            {/* Resumen estadístico */}
            <div className={style.resumenSection}>
                <h3>Resumen del Sistema</h3>
                <div className={style.resumenGrid}>
                    <div className={style.resumenItem}>
                        <span className={style.resumenLabel}>Tasa de Utilización</span>
                        <span className={style.resumenValue}>{tasaUtilizacion}%</span>
                        <div className={style.progressBar}>
                            <div 
                                className={style.progressFill}
                                style={{ width: `${tasaUtilizacion}%` }}
                            ></div>
                        </div>
                    </div>
                    
                    <div className={style.resumenItem}>
                        <span className={style.resumenLabel}>Eficiencia de Asignaciones</span>
                        <span className={style.resumenValue}>{eficienciaAsignaciones}%</span>
                        <div className={style.progressBar}>
                            <div 
                                className={style.progressFill}
                                style={{ width: `${eficienciaAsignaciones}%` }}
                            ></div>
                        </div>
                    </div>
                    
                    <div className={style.resumenItem}>
                        <span className={style.resumenLabel}>Disponibilidad de Conductores</span>
                        <span className={style.resumenValue}>
                            {conductoresData.length > 0 ? (conductoresDisponibles / conductoresData.length * 100).toFixed(1) : 0}%
                        </span>
                        <div className={style.progressBar}>
                            <div 
                                className={style.progressFill}
                                style={{ 
                                    width: `${conductoresData.length > 0 ? (conductoresDisponibles / conductoresData.length * 100) : 0}%` 
                                }}
                            ></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VistaGeneral;
