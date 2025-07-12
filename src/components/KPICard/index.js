// src/components/KPICard/index.js
import { h } from 'preact';
import { motion } from 'framer-motion';
import style from './style.css';

const KPICard = ({ title, value, unit, trend, description, icon, color = 'primary', isLoading }) => {
    const getTrendIcon = () => {
        switch (trend) {
            case 'positiva':
                return '📈';
            case 'negativa':
                return '📉';
            default:
                return '➖';
        }
    };

    const getTrendClass = () => {
        switch (trend) {
            case 'positiva':
                return style.trendPositive;
            case 'negativa':
                return style.trendNegative;
            default:
                return style.trendNeutral;
        }
    };

    if (isLoading) {
        return (
            <div className={`${style.kpiCard} ${style.loading}`}>
                <div className={style.loadingContent}>
                    <div className={style.skeleton} />
                    <div className={style.skeletonSmall} />
                    <div className={style.skeletonMedium} />
                </div>
            </div>
        );
    }

    return (
        <motion.div 
            className={`${style.kpiCard} ${style[color]}`}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            whileHover={{ scale: 1.02 }}
        >
            <div className={style.cardHeader}>
                <div className={style.iconContainer}>
                    {icon && <span className={style.icon}>{icon}</span>}
                </div>
                <div className={style.trendContainer}>
                    <span className={getTrendClass()}>
                        {getTrendIcon()}
                    </span>
                </div>
            </div>

            <div className={style.cardBody}>
                <h3 className={style.title}>{title}</h3>
                <div className={style.valueContainer}>
                    <span className={style.value}>{value}</span>
                    {unit && <span className={style.unit}>{unit}</span>}
                </div>
                {description && (
                    <p className={style.description}>{description}</p>
                )}
            </div>

            <div className={style.cardFooter}>
                <div className={style.sparkline}>
                    {/* Aquí podrías agregar un mini gráfico sparkline si tienes datos históricos */}
                </div>
            </div>
        </motion.div>
    );
};

export default KPICard;
