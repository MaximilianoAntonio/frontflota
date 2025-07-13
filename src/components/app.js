// src/components/app.js
import { h, Component } from 'preact';
import { Router, route } from 'preact-router'; // Importa route
import { getToken, logoutUser, isAuthenticated } from '../services/authService'; // Importa funciones de auth
import { lazy, Suspense } from 'preact/compat';

import Header from './header';
import ApiHealthCheck from './ApiHealthCheck';
import Home from '../routes/home';
import LoginPage from '../routes/login'; // Mantener login cargado inmediatamente

// Lazy loading para rutas pesadas
const AsignacionesPage = lazy(() => import('../routes/asignaciones'));
const VehiculosPage = lazy(() => import('../routes/vehiculos'));
const ConductoresPage = lazy(() => import('../routes/conductores'));
const MantenimientoPage = lazy(() => import('../routes/mantenimiento'));
const CamaraPage = lazy(() => import('../routes/camara/index'));
const MasInformacionPage = lazy(() => import('../routes/mas-informacion'));
const DashboardPage = lazy(() => import('../routes/dashboard'));

// Componente de loading mejorado
const Loading = () => (
    <div style={{ 
        display: 'flex', 
        flexDirection: 'column',
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '200px',
        fontSize: '1.1rem',
        color: '#6c757d'
    }}>
        <div className="spinner" style={{
            width: '40px',
            height: '40px',
            border: '4px solid #f3f3f3',
            borderTop: '4px solid #673ab8',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            marginBottom: '16px'
        }}></div>
        Cargando...
    </div>
);



// Componente wrapper para rutas protegidas
const PrivateRoute = ({ component: Comp, ...props }) => {
    if (!isAuthenticated()) {
        route('/login', true); // Redirige a login si no hay token
        return null; // Evita renderizar el componente protegido
    }
    return (
        <ApiHealthCheck>
            <Suspense fallback={<Loading />}>
                <Comp {...props} />
            </Suspense>
        </ApiHealthCheck>
    );
};

// Componente wrapper para la página de Más Información
const MasInformacionRoute = () => (
    <Suspense fallback={<Loading />}>
        <MasInformacionPage />
    </Suspense>
);


export default class App extends Component {
    state = {
        currentUrl: '',
        isLoggedIn: isAuthenticated(),
        userGroup: JSON.parse(localStorage.getItem('userGroup') || '[]'),
    };

    componentDidMount() {
        // Establecer el título de la página
        document.title = 'Sistema de Gestión Vehicular - SSVQ';
        
        // Agregar estilos para el spinner
        const style = document.createElement('style');
        style.textContent = `
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
            .api-health-checking, .api-health-error, .auth-required {
                display: flex;
                justify-content: center;
                align-items: center;
                min-height: 60vh;
                padding: 2rem;
            }
            .error-container, .auth-container {
                text-align: center;
                max-width: 500px;
                padding: 2rem;
                border-radius: 8px;
                background: #f8f9fa;
                border: 1px solid #dee2e6;
            }
            .error-actions {
                margin: 1rem 0;
                display: flex;
                gap: 1rem;
                justify-content: center;
            }
            .retry-btn, .reload-btn, .login-btn {
                padding: 0.75rem 1.5rem;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                font-weight: 500;
            }
            .retry-btn { background: #007bff; color: white; }
            .reload-btn { background: #6c757d; color: white; }
            .login-btn { background: #28a745; color: white; }
        `;
        document.head.appendChild(style);
    }

    handleRoute = e => {
        this.currentUrl = e.url;
        this.setState({ 
            currentUrl: e.url, 
            isLoggedIn: isAuthenticated(),
            userGroup: JSON.parse(localStorage.getItem('userGroup') || '[]'),
        });
    };

    handleLogin = (userData) => {
        // Actualizar estado cuando el usuario se loguea
        this.setState({ 
            isLoggedIn: true, 
            userGroup: userData.groups || [] 
        });
        route('/dashboard', true);
    };

    handleLogout = () => {
        logoutUser();
        localStorage.removeItem('userGroup');
        this.setState({ isLoggedIn: false, userGroup: [] });
        route('/login', true);
    };

    render() {
        return (
            <div id="app">
                <Header 
                    isLoggedIn={this.state.isLoggedIn} 
                    onLogout={this.handleLogout}
                    userGroup={this.state.userGroup} // <-- Ahora es array
                />
                <main class="page-content">
                    <Router onChange={this.handleRoute}>
                        <Home path="/" />
                        <LoginPage path="/login" onLoginSuccess={this.handleLogin} />
                        <PrivateRoute component={DashboardPage} path="/dashboard" />
                        <PrivateRoute component={VehiculosPage} path="/vehiculos" />
                        <PrivateRoute component={ConductoresPage} path="/conductores" />
                        <PrivateRoute component={AsignacionesPage} path="/asignaciones" userGroup={this.state.userGroup} />
                        <PrivateRoute component={MantenimientoPage} path="/mantenimiento" />
                        <PrivateRoute component={CamaraPage} path="/camara" />
                        <MasInformacionRoute path="/mas-informacion" />
                    </Router>
                </main>
            </div>
        );
    }
}