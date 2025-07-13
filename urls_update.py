# Agregar estas líneas a tu asignaciones/urls.py

# Importar las nuevas vistas al inicio del archivo
from .views import (
    VehiculoViewSet,
    ConductorViewSet,
    AsignacionViewSet,
    RegistroTurnoViewSet,
    CustomAuthToken,
    UserGroupView,
    DashboardStatsView,        # NUEVA
    DashboardRefreshCacheView  # NUEVA
)

# Agregar estas rutas al final de urlpatterns
urlpatterns = [
    path('', include(router.urls)),
    path('get-token/', CustomAuthToken.as_view(), name='get-token'),
    path('user-groups/', UserGroupView.as_view(), name='user-groups'),
    # NUEVAS RUTAS PARA EL DASHBOARD
    path('dashboard/stats/', DashboardStatsView.as_view(), name='dashboard-stats'),
    path('dashboard/refresh-cache/', DashboardRefreshCacheView.as_view(), name='dashboard-refresh-cache'),
]
