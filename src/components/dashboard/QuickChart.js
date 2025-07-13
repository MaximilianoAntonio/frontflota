import { useEffect, useRef } from 'preact/hooks';
import Chart from 'chart.js/auto';
import './QuickChart.css';

const QuickChart = ({ 
    type = 'bar',
    data = [],
    labelField,
    valueField,
    colors = ['#667eea', '#764ba2', '#f093fb', '#f5576c'],
    horizontal = false,
    height = 300
}) => {
    const chartRef = useRef(null);
    const chartInstance = useRef(null);

    useEffect(() => {
        if (!chartRef.current || !data || data.length === 0) return;

        // Destruir chart anterior si existe
        if (chartInstance.current) {
            chartInstance.current.destroy();
        }

        const ctx = chartRef.current.getContext('2d');

        // Preparar datos para Chart.js
        const chartData = {
            labels: data.map(item => {
                const label = item[labelField] || 'Sin datos';
                // Formatear etiquetas largas
                return label.length > 20 ? label.substring(0, 17) + '...' : label;
            }),
            datasets: [{
                label: 'Cantidad',
                data: data.map(item => item[valueField] || 0),
                backgroundColor: colors,
                borderColor: colors.map(color => color),
                borderWidth: type === 'line' ? 2 : 1,
                fill: type === 'area',
                tension: type === 'line' ? 0.4 : 0
            }]
        };

        // Configuración del chart
        const config = {
            type: type === 'area' ? 'line' : type,
            data: chartData,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: type === 'doughnut' || type === 'pie',
                        position: 'bottom',
                        labels: {
                            padding: 20,
                            usePointStyle: true,
                            font: {
                                size: 12,
                                weight: '500'
                            }
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleColor: 'white',
                        bodyColor: 'white',
                        borderColor: 'rgba(255, 255, 255, 0.1)',
                        borderWidth: 1,
                        cornerRadius: 8,
                        displayColors: true,
                        callbacks: {
                            title: function(context) {
                                return data[context[0].dataIndex][labelField] || 'Sin datos';
                            },
                            label: function(context) {
                                const value = context.parsed.y || context.parsed;
                                const total = data.reduce((sum, item) => sum + (item[valueField] || 0), 0);
                                const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                                return `${value} (${percentage}%)`;
                            }
                        }
                    }
                },
                scales: {
                    ...(type !== 'doughnut' && type !== 'pie' && {
                        x: {
                            display: true,
                            grid: {
                                display: false
                            },
                            ticks: {
                                font: {
                                    size: 11,
                                    weight: '500'
                                },
                                color: '#4a5568'
                            }
                        },
                        y: {
                            display: true,
                            beginAtZero: true,
                            grid: {
                                color: 'rgba(0, 0, 0, 0.1)',
                                lineWidth: 1
                            },
                            ticks: {
                                font: {
                                    size: 11,
                                    weight: '500'
                                },
                                color: '#4a5568'
                            }
                        }
                    })
                },
                indexAxis: horizontal ? 'y' : 'x',
                animation: {
                    duration: 1000,
                    easing: 'easeOutQuart'
                },
                interaction: {
                    intersect: false,
                    mode: 'index'
                }
            }
        };

        // Configuraciones específicas por tipo
        if (type === 'doughnut') {
            config.options.cutout = '60%';
            config.options.plugins.legend.display = true;
        }

        if (type === 'pie') {
            config.options.plugins.legend.display = true;
        }

        if (type === 'line' || type === 'area') {
            config.data.datasets[0].pointBackgroundColor = colors[0];
            config.data.datasets[0].pointBorderColor = colors[0];
            config.data.datasets[0].pointRadius = 4;
            config.data.datasets[0].pointHoverRadius = 6;
        }

        // Crear el chart
        chartInstance.current = new Chart(ctx, config);

        return () => {
            if (chartInstance.current) {
                chartInstance.current.destroy();
            }
        };
    }, [data, type, labelField, valueField, colors, horizontal]);

    if (!data || data.length === 0) {
        return (
            <div className="quick-chart-container" style={{ height: `${height}px` }}>
                <div className="no-chart-data">
                    <span className="no-data-icon">📊</span>
                    <p>Sin datos para mostrar</p>
                    <small>No hay información disponible para este gráfico</small>
                </div>
            </div>
        );
    }

    return (
        <div className="quick-chart-container" style={{ height: `${height}px` }}>
            <canvas ref={chartRef}></canvas>
        </div>
    );
};

export default QuickChart;
