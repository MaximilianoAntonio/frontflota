import './MetricCard.css';

const MetricCard = ({ 
    title, 
    value, 
    subtitle, 
    percentage, 
    change, 
    icon, 
    color = '#667eea',
    warning = false 
}) => {
    const getChangeStatus = (change) => {
        if (!change) return 'neutral';
        return change > 0 ? 'positive' : change < 0 ? 'negative' : 'neutral';
    };

    const formatChange = (change) => {
        if (!change) return null;
        const sign = change > 0 ? '+' : '';
        return `${sign}${change}%`;
    };

    return (
        <div className={`metric-card ${warning ? 'warning' : ''}`}>
            <div className="metric-header">
                <div className="metric-icon" style={{ backgroundColor: color }}>
                    {icon}
                </div>
                <div className="metric-info">
                    <h4 className="metric-title">{title}</h4>
                    {subtitle && (
                        <p className="metric-subtitle">{subtitle}</p>
                    )}
                </div>
            </div>
            
            <div className="metric-body">
                <div className="metric-value" style={{ color: color }}>
                    {value}
                </div>
                
                {percentage !== undefined && (
                    <div className="metric-percentage">
                        <div className="percentage-bar">
                            <div 
                                className="percentage-fill"
                                style={{ 
                                    width: `${Math.min(percentage, 100)}%`,
                                    backgroundColor: color 
                                }}
                            ></div>
                        </div>
                        <span className="percentage-value">{percentage}%</span>
                    </div>
                )}
                
                {change !== undefined && (
                    <div className={`metric-change ${getChangeStatus(change)}`}>
                        <span className="change-icon">
                            {change > 0 ? '↗️' : change < 0 ? '↘️' : '➡️'}
                        </span>
                        <span>{formatChange(change)} vs período anterior</span>
                    </div>
                )}
            </div>
            
            {warning && (
                <div className="metric-warning">
                    <span>⚠️ Requiere atención</span>
                </div>
            )}
        </div>
    );
};

export default MetricCard;
