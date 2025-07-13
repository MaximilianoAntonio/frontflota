# Agregar a tu asignaciones/urls.py

# En las importaciones, agregar:
from .views import (
    # ...existing imports...
    HealthCheckView  # NUEVA
)

# En urlpatterns, agregar:
path('health/', HealthCheckView.as_view(), name='health-check'),
