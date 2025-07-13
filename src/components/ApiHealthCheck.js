// src/components/ApiHealthCheck.js
import { useState, useEffect } from 'preact/hooks';
import { checkApiHealth, API_BASE_URL } from '../config';
import { isAuthenticated } from '../services/authService';

const ApiHealthCheck = ({ children }) => {
    const [apiStatus, setApiStatus] = useState('checking');
    const [authStatus, setAuthStatus] = useState(false);

    useEffect(() => {
        checkStatus();
        
        // Verificar cada 30 segundos
        const interval = setInterval(checkStatus, 30000);
        
        return () => clearInterval(interval);
    }, []);

    const checkStatus = async () => {
        try {
            const isApiHealthy = await checkApiHealth();
            const isUserAuthenticated = isAuthenticated();
            
            setApiStatus(isApiHealthy ? 'healthy' : 'unhealthy');
            setAuthStatus(isUserAuthenticated);
        } catch (error) {
            console.error('Health check failed:', error);
            setApiStatus('error');
        }
    };

    if (apiStatus === 'checking') {
        return (
            <div className="api-health-checking">
                <div className="spinner"></div>
                <p>Verificando conexión con el servidor...</p>
            </div>
        );
    }

    if (apiStatus === 'unhealthy' || apiStatus === 'error') {
        return (
            <div className="api-health-error">
                <div className="error-container">
                    <h3>🚫 Error de Conexión</h3>
                    <p>No se puede conectar con el servidor:</p>
                    <code>{API_BASE_URL}</code>
                    <div className="error-actions">
                        <button onClick={checkStatus} className="retry-btn">
                            Reintentar Conexión
                        </button>
                        <button onClick={() => window.location.reload()} className="reload-btn">
                            Recargar Página
                        </button>
                    </div>
                    <div className="error-details">
                        <details>
                            <summary>Detalles técnicos</summary>
                            <ul>
                                <li>Estado API: {apiStatus}</li>
                                <li>Autenticado: {authStatus ? 'Sí' : 'No'}</li>
                                <li>URL API: {API_BASE_URL}</li>
                                <li>Timestamp: {new Date().toLocaleString()}</li>
                            </ul>
                        </details>
                    </div>
                </div>
            </div>
        );
    }

    if (!authStatus) {
        return (
            <div className="auth-required">
                <div className="auth-container">
                    <h3>🔐 Autenticación Requerida</h3>
                    <p>Tu sesión ha expirado o no estás autenticado.</p>
                    <button 
                        onClick={() => window.location.href = '/login'} 
                        className="login-btn"
                    >
                        Ir al Login
                    </button>
                </div>
            </div>
        );
    }

    return children;
};

export default ApiHealthCheck;
