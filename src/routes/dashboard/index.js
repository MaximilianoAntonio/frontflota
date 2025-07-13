import { Component } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import './style.css';

// Importar componentes de las pestañas
import OperationsOverview from '../../components/dashboard/OperationsOverview';
import VehicleDetails from '../../components/dashboard/VehicleDetails';
import DriverDetails from '../../components/dashboard/DriverDetails';
import AssignmentMap from '../../components/dashboard/AssignmentMap';

const Dashboard = () => {
    const [activeTab, setActiveTab] = useState('overview');
    const [timeFilter, setTimeFilter] = useState({
        period: 'monthly',
        startDate: '',
        endDate: ''
    });
    const [isLoading, setIsLoading] = useState(false);
    const [lastUpdate, setLastUpdate] = useState(null);

    // Función para actualizar datos manualmente
    const refreshData = async () => {
        setIsLoading(true);
        try {
            // Llamar al endpoint de actualización de caché
            const response = await fetch(`${API_BASE_URL}/dashboard/refresh-cache/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(timeFilter)
            });
            
            if (response.ok) {
                setLastUpdate(new Date().toLocaleString());
                // Recargar los datos en todos los componentes hijos
                window.dispatchEvent(new CustomEvent('dashboardRefresh'));
            }
        } catch (error) {
            console.error('Error refreshing dashboard data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // Configurar actualización automática cada 5 minutos
    useEffect(() => {
        const interval = setInterval(() => {
            if (document.visibilityState === 'visible') {
                refreshData();
            }
        }, 5 * 60 * 1000); // 5 minutos

        return () => clearInterval(interval);
    }, []);

    const tabs = [
        { id: 'overview', label: 'Vista General', icon: '📊' },
        { id: 'vehicles', label: 'Vehículos', icon: '🚗' },
        { id: 'drivers', label: 'Conductores', icon: '👨‍💼' },
        { id: 'map', label: 'Mapa', icon: '🗺️' }
    ];

    const timeFilterOptions = [
        { value: 'daily', label: 'Diario' },
        { value: 'weekly', label: 'Semanal' },
        { value: 'monthly', label: 'Mensual' },
        { value: 'quarterly', label: 'Trimestral' },
        { value: 'yearly', label: 'Anual' },
        { value: 'custom', label: 'Personalizado' }
    ];

    const handleTimeFilterChange = (field, value) => {
        setTimeFilter(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const renderActiveTab = () => {
        const commonProps = { timeFilter, isLoading };
        
        switch (activeTab) {
            case 'overview':
                return <OperationsOverview {...commonProps} />;
            case 'vehicles':
                return <VehicleDetails {...commonProps} />;
            case 'drivers':
                return <DriverDetails {...commonProps} />;
            case 'map':
                return <AssignmentMap {...commonProps} />;
            default:
                return <OperationsOverview {...commonProps} />;
        }
    };

    return (
        <div className="dashboard-container">
            {/* Header del Dashboard */}
            <div className="dashboard-header">
                <div className="dashboard-title">
                    <h1>📊 Dashboard de Mantenimiento</h1>
                    <p>Sistema de Gestión de Flota SSVQ</p>
                </div>
                
                <div className="dashboard-controls">
                    {/* Filtros de Tiempo */}
                    <div className="time-filter-group">
                        <label>Período:</label>
                        <select 
                            value={timeFilter.period}
                            onChange={(e) => handleTimeFilterChange('period', e.target.value)}
                            className="filter-select"
                        >
                            {timeFilterOptions.map(option => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                        
                        {timeFilter.period === 'custom' && (
                            <div className="custom-date-range">
                                <input
                                    type="date"
                                    value={timeFilter.startDate}
                                    onChange={(e) => handleTimeFilterChange('startDate', e.target.value)}
                                    className="date-input"
                                />
                                <span>hasta</span>
                                <input
                                    type="date"
                                    value={timeFilter.endDate}
                                    onChange={(e) => handleTimeFilterChange('endDate', e.target.value)}
                                    className="date-input"
                                />
                            </div>
                        )}
                    </div>
                    
                    {/* Botón de Actualización */}
                    <button 
                        onClick={refreshData}
                        disabled={isLoading}
                        className={`refresh-btn ${isLoading ? 'loading' : ''}`}
                    >
                        {isLoading ? '🔄' : '↻'} 
                        {isLoading ? 'Actualizando...' : 'Actualizar'}
                    </button>
                    
                    {lastUpdate && (
                        <span className="last-update">
                            Última actualización: {lastUpdate}
                        </span>
                    )}
                </div>
            </div>

            {/* Navegación por Pestañas */}
            <div className="dashboard-tabs">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
                    >
                        <span className="tab-icon">{tab.icon}</span>
                        <span className="tab-label">{tab.label}</span>
                    </button>
                ))}
            </div>

            {/* Contenido de la Pestaña Activa */}
            <div className="dashboard-content">
                {renderActiveTab()}
            </div>

            {/* Indicador de Carga Global */}
            {isLoading && (
                <div className="global-loading-overlay">
                    <div className="loading-spinner">
                        <div className="spinner"></div>
                        <p>Actualizando datos del dashboard...</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;
