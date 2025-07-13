# Agregar este código a tu asignaciones/views.py

class HealthCheckView(APIView):
    """
    Vista simple para verificar que la API está funcionando
    """
    permission_classes = [permissions.AllowAny]  # No requiere autenticación
    
    def get(self, request):
        return Response({
            'status': 'healthy',
            'timestamp': timezone.now().isoformat(),
            'version': '1.0.0',
            'message': 'API is running correctly'
        }, status=status.HTTP_200_OK)
