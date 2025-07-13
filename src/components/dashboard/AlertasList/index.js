// src/components/dashboard/AlertasList/index.js
import { h } from 'preact';
import { useState } from 'preact/hooks';
import style from './style.css';

const AlertasList = ({ alertas = [] }) => {
    const [mostrarTodas, setMostrarTodas] = useState(false);
    
    const alertasVisibles = mostrarTodas ? alertas : alertas.slice(0, 3);
    
    const getAlertIcon = (tipo) => {
        const iconos = {
            mantenimiento: '🔧',
            licencia: '📄',
            combustible: '⛽',
            seguridad: '⚠️',
            sistema: '💻',
            default: '🔔'
        };
        return iconos[tipo] || iconos.default;
    };
    
    const getSeverityClass = (severidad) => {
        const clases = {
            alta: style.severidadAlta,
            media: style.severidadMedia,
            baja: style.severidadBaja
        };
        return clases[severidad] || style.severidadBaja;
    };
    
    const formatFecha = (fechaString) => {
        const fecha = new Date(fechaString);
        const ahora = new Date();
        const diferencia = ahora - fecha;
        
        const minutos = Math.floor(diferencia / (1000 * 60));
        const horas = Math.floor(diferencia / (1000 * 60 * 60));
        const dias = Math.floor(diferencia / (1000 * 60 * 60 * 24));
        
        if (minutos < 60) {
            return `Hace ${minutos} minutos`;
        } else if (horas < 24) {
            return `Hace ${horas} horas`;
        } else {
            return `Hace ${dias} días`;
        }
    };

    if (alertas.length === 0) {
        return (
            <div className={style.alertasContainer}>
                <h3 className={style.titulo}>Alertas y Notificaciones</h3>
                <div className={style.noAlertas}>
                    <div className={style.noAlertasIcon}>✅</div>
                    <p>No hay alertas pendientes</p>
                    <span className={style.noAlertasSubtitle}>Todos los sistemas funcionan correctamente</span>
                </div>
            </div>
        );
    }

    return (
        <div className={style.alertasContainer}>
            <div className={style.header}>
                <h3 className={style.titulo}>
                    Alertas y Notificaciones
                    <span className={style.contador}>({alertas.length})</span>
                </h3>
                
                {alertas.length > 3 && (
                    <button 
                        onClick={() => setMostrarTodas(!mostrarTodas)}
                        className={style.toggleButton}
                    >
                        {mostrarTodas ? 'Ver menos' : `Ver todas (${alertas.length})`}
                    </button>
                )}
            </div>
            
            <div className={style.alertasList}>
                {alertasVisibles.map(alerta => (
                    <div 
                        key={alerta.id} 
                        className={`${style.alertaItem} ${getSeverityClass(alerta.severidad)}`}
                    >
                        <div className={style.alertaIcono}>
                            {getAlertIcon(alerta.tipo)}
                        </div>
                        
                        <div className={style.alertaContent}>
                            <div className={style.alertaHeader}>
                                <h4 className={style.alertaTitulo}>{alerta.titulo}</h4>
                                <span className={style.alertaTiempo}>
                                    {formatFecha(alerta.fecha)}
                                </span>
                            </div>
                            
                            <p className={style.alertaMensaje}>{alerta.mensaje}</p>
                            
                            <div className={style.alertaFooter}>
                                <span className={`${style.alertaTipo} ${getSeverityClass(alerta.severidad)}`}>
                                    {alerta.severidad.toUpperCase()}
                                </span>
                                
                                <div className={style.alertaAcciones}>
                                    <button className={style.accionButton}>
                                        Ver detalles
                                    </button>
                                    <button className={style.accionButton}>
                                        Marcar como leída
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            
            {alertas.length > 3 && !mostrarTodas && (
                <div className={style.masAlertas}>
                    <button 
                        onClick={() => setMostrarTodas(true)}
                        className={style.verMasButton}
                    >
                        Ver {alertas.length - 3} alertas más
                    </button>
                </div>
            )}
        </div>
    );
};

export default AlertasList;
