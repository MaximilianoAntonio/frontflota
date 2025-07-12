// src/components/Chart/index.js
import { h } from 'preact';
import { useEffect, useRef } from 'preact/hooks';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
    TimeScale,
    LineController,
    BarController,
    DoughnutController,
    PieController
} from 'chart.js';
import 'chartjs-adapter-date-fns';

// Registrar componentes de Chart.js
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
    TimeScale,
    LineController,
    BarController,
    DoughnutController,
    PieController
);

const Chart = ({ type, data, options, className, id }) => {
    const canvasRef = useRef(null);
    const chartInstanceRef = useRef(null);

    useEffect(() => {
        if (!canvasRef.current || !data) return;

        // Destruir chart existente si existe
        if (chartInstanceRef.current) {
            chartInstanceRef.current.destroy();
        }

        const ctx = canvasRef.current.getContext('2d');
        
        // Configuración por defecto
        const defaultOptions = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                },
            },
            interaction: {
                mode: 'nearest',
                axis: 'x',
                intersect: false,
            },
        };

        // Configuraciones específicas por tipo de gráfico
        const typeSpecificOptions = {
            line: {
                scales: {
                    x: {
                        display: true,
                        title: {
                            display: true,
                        }
                    },
                    y: {
                        display: true,
                        title: {
                            display: true,
                        }
                    }
                }
            },
            bar: {
                scales: {
                    x: {
                        display: true,
                        title: {
                            display: true,
                        }
                    },
                    y: {
                        display: true,
                        title: {
                            display: true,
                        },
                        beginAtZero: true
                    }
                }
            },
            doughnut: {
                cutout: '60%',
                plugins: {
                    legend: {
                        position: 'right',
                        labels: {
                            usePointStyle: true,
                            padding: 20
                        }
                    }
                }
            },
            pie: {
                plugins: {
                    legend: {
                        position: 'right',
                        labels: {
                            usePointStyle: true,
                            padding: 20
                        }
                    }
                }
            }
        };

        // Combinar opciones
        const finalOptions = {
            ...defaultOptions,
            ...typeSpecificOptions[type],
            ...options
        };

        // Crear nueva instancia del gráfico
        chartInstanceRef.current = new ChartJS(ctx, {
            type,
            data,
            options: finalOptions
        });

        return () => {
            if (chartInstanceRef.current) {
                chartInstanceRef.current.destroy();
            }
        };
    }, [type, data, options]);

    return (
        <canvas
            ref={canvasRef}
            className={className}
            id={id}
            style={{ maxHeight: '400px' }}
        />
    );
};

export default Chart;
