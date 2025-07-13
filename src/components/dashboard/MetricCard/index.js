// src/components/dashboard/MetricCard/index.js
import { h } from 'preact';
import style from './style.css';

const MetricCard = ({ 
    title, 
    value, 
    subtitle, 
    icon, 
    trend, 
    color = 'blue',
    loading = false 
}) => {
    const colorClasses = {
        blue: style.colorBlue,
        green: style.colorGreen,
        purple: style.colorPurple,
        orange: style.colorOrange,
        red: style.colorRed
    };

    const formatValue = (val) => {
        if (typeof val === 'number') {
            if (val >= 1000000) {
                return `${(val / 1000000).toFixed(1)}M`;
            } else if (val >= 1000) {
                return `${(val / 1000).toFixed(1)}K`;
            }
            return val.toLocaleString();
        }
        return val;
    };

    if (loading) {
        return (
            <div className={`${style.metricCard} ${style.loading}`}>
                <div className={style.shimmer}></div>
            </div>
        );
    }

    return (
        <div className={`${style.metricCard} ${colorClasses[color]}`}>
            <div className={style.cardHeader}>
                <div className={style.iconContainer}>
                    <span className={style.icon}>{icon}</span>
                </div>
                
                {trend && (
                    <div className={`${style.trend} ${trend.direction === 'up' ? style.trendUp : style.trendDown}`}>
                        <span className={style.trendIcon}>
                            {trend.direction === 'up' ? '↗️' : '↘️'}
                        </span>
                        <span className={style.trendValue}>{trend.value}</span>
                    </div>
                )}
            </div>
            
            <div className={style.cardBody}>
                <h3 className={style.title}>{title}</h3>
                <div className={style.value}>{formatValue(value)}</div>
                {subtitle && (
                    <p className={style.subtitle}>{subtitle}</p>
                )}
            </div>
            
            <div className={style.cardFooter}>
                <div className={style.indicator}></div>
            </div>
        </div>
    );
};

export default MetricCard;
