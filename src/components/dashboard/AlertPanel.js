import { useState } from 'preact/hooks';
import './AlertPanel.css';

const AlertPanel = ({ vehiculosMantenimiento, conductoresStatus, general }) => {
    const [expanded, setExpanded] = useState(false);

    // Generar alertas críticas
    const generateAlerts = () => {
        const alerts = [];

        // Alertas de vehículos críticos
        if (vehiculosMantenimiento) {
            const criticos = vehiculosMantenimiento.filter(v => 
                v.mantenimiento?.estado === 'critico'
            );
            
            criticos.forEach(vehiculo => {
                alerts.push({
                    type: 'critical',
                    category: 'vehiculo',
                    title: `Vehículo ${vehiculo.patente} - Mantenimiento CRÍTICO`,
                    message: `Requiere mantenimiento inmediato. Kilometraje: ${vehiculo.kilometraje} km`,
                    action: 'Programar mantenimiento',
                    vehiculoId: vehiculo.id
                });
            });

            // Alertas urgentes
            const urgentes = vehiculosMantenimiento.filter(v => 
                v.mantenimiento?.estado === 'urgente'
            );
            
            urgentes.slice(0, 3).forEach(vehiculo => {
                alerts.push({
                    type: 'warning',
                    category: 'vehiculo',
                    title: `Vehículo ${vehiculo.patente} - Mantenimiento Urgente`,
                    message: `Se acerca al límite de kilometraje. ${vehiculo.mantenimiento.km_restantes} km restantes`,
                    action: 'Programar mantenimiento',
                    vehiculoId: vehiculo.id
                });
            });
        }

        // Alertas de conductores
        if (conductoresStatus) {
            const inactivos = conductoresStatus.filter(c => 
                c.horarios?.estado_trabajo === 'inactivo'
            );
            
            if (inactivos.length > 0) {
                alerts.push({
                    type: 'warning',
                    category: 'conductor',
                    title: `${inactivos.length} Conductor(es) Inactivo(s)`,
                    message: `Conductores sin actividad en el período seleccionado`,
                    action: 'Revisar disponibilidad'
                });
            }

            const bajoRendimiento = conductoresStatus.filter(c => 
                c.eficiencia_general < 60
            );
            
            if (bajoRendimiento.length > 0) {
                alerts.push({
                    type: 'info',
                    category: 'conductor',
                    title: `${bajoRendimiento.length} Conductor(es) con Bajo Rendimiento`,
                    message: `Eficiencia promedio inferior al 60%`,
                    action: 'Revisar asignaciones'
                });
            }
        }

        // Alertas generales
        if (general) {
            if (general.tasa_completitud < 70) {
                alerts.push({
                    type: 'warning',
                    category: 'operacion',
                    title: 'Baja Tasa de Completitud',
                    message: `Solo ${general.tasa_completitud}% de asignaciones completadas`,
                    action: 'Revisar operaciones'
                });
            }

            if (general.vehiculos_en_mantenimiento > general.vehiculos_disponibles * 0.3) {
                alerts.push({
                    type: 'critical',
                    category: 'flota',
                    title: 'Alta Proporción en Mantenimiento',
                    message: `${general.vehiculos_en_mantenimiento} vehículos en mantenimiento`,
                    action: 'Revisar planning'
                });
            }
        }

        return alerts.sort((a, b) => {
            const priority = { critical: 3, warning: 2, info: 1 };
            return priority[b.type] - priority[a.type];
        });
    };

    const alerts = generateAlerts();
    const criticalAlerts = alerts.filter(a => a.type === 'critical');
    const warningAlerts = alerts.filter(a => a.type === 'warning');
    const infoAlerts = alerts.filter(a => a.type === 'info');

    const getAlertIcon = (type) => {
        switch (type) {
            case 'critical': return '🚨';
            case 'warning': return '⚠️';
            case 'info': return 'ℹ️';
            default: return '📋';
        }
    };

    const handleAlertAction = (alert) => {
        // Aquí puedes implementar las acciones específicas
        console.log('Acción de alerta:', alert);
        
        if (alert.category === 'vehiculo' && alert.vehiculoId) {
            // Redirigir a la vista de vehículos específica
            window.location.hash = `#/vehiculos?highlight=${alert.vehiculoId}`;
        } else if (alert.category === 'conductor') {
            // Redirigir a la vista de conductores
            window.location.hash = '#/conductores';
        }
    };

    if (alerts.length === 0) {
        return (
            <div className="alert-panel">
                <div className="alert-panel-header">
                    <h3>✅ Estado del Sistema</h3>
                </div>
                <div className="no-alerts">
                    <div className="no-alerts-content">
                        <span className="no-alerts-icon">🎉</span>
                        <p>¡Todo funcionando correctamente!</p>
                        <small>No hay alertas críticas en este momento</small>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="alert-panel">
            <div className="alert-panel-header" onClick={() => setExpanded(!expanded)}>
                <h3>
                    🔔 Alertas y Notificaciones
                    <span className="alert-count">
                        {criticalAlerts.length > 0 && (
                            <span className="critical-badge">{criticalAlerts.length} críticas</span>
                        )}
                        {warningAlerts.length > 0 && (
                            <span className="warning-badge">{warningAlerts.length} advertencias</span>
                        )}
                    </span>
                </h3>
                <button className="expand-btn">
                    {expanded ? '▼' : '▶'}
                </button>
            </div>

            {/* Resumen Rápido */}
            <div className="alerts-summary">
                {criticalAlerts.length > 0 && (
                    <div className="summary-item critical">
                        <span className="summary-count">{criticalAlerts.length}</span>
                        <span className="summary-label">Críticas</span>
                    </div>
                )}
                {warningAlerts.length > 0 && (
                    <div className="summary-item warning">
                        <span className="summary-count">{warningAlerts.length}</span>
                        <span className="summary-label">Advertencias</span>
                    </div>
                )}
                {infoAlerts.length > 0 && (
                    <div className="summary-item info">
                        <span className="summary-count">{infoAlerts.length}</span>
                        <span className="summary-label">Informativas</span>
                    </div>
                )}
            </div>

            {/* Lista Detallada (Colapsable) */}
            {expanded && (
                <div className="alerts-detailed">
                    {alerts.map((alert, index) => (
                        <div key={index} className={`alert-item ${alert.type}`}>
                            <div className="alert-icon">
                                {getAlertIcon(alert.type)}
                            </div>
                            <div className="alert-content">
                                <h4 className="alert-title">{alert.title}</h4>
                                <p className="alert-message">{alert.message}</p>
                                <div className="alert-meta">
                                    <span className="alert-category">{alert.category}</span>
                                    <span className="alert-time">Ahora</span>
                                </div>
                            </div>
                            <div className="alert-actions">
                                <button 
                                    className="action-btn"
                                    onClick={() => handleAlertAction(alert)}
                                >
                                    {alert.action}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Acciones Rápidas */}
            <div className="quick-actions">
                <button 
                    className="quick-action-btn"
                    onClick={() => window.location.hash = '#/vehiculos'}
                >
                    🚗 Ver Vehículos
                </button>
                <button 
                    className="quick-action-btn"
                    onClick={() => window.location.hash = '#/conductores'}
                >
                    👨‍💼 Ver Conductores
                </button>
                <button 
                    className="quick-action-btn"
                    onClick={() => window.location.hash = '#/mantenimiento'}
                >
                    🔧 Mantenimiento
                </button>
            </div>
        </div>
    );
};

export default AlertPanel;
