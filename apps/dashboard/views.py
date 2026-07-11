from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

from .services.dashboard_service import DashboardService

dashboard_service = DashboardService()


def _tenant_id(user):
    tenant = user.ensure_tenant_context()
    return tenant.id if tenant else None


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard_summary_view(request):
    tenant_id = _tenant_id(request.user)
    if not tenant_id:
        return Response({'error': 'No tenant'}, status=status.HTTP_400_BAD_REQUEST)
    return Response(dashboard_service.get_summary(tenant_id))


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard_recent_invoices_view(request):
    tenant_id = _tenant_id(request.user)
    if not tenant_id:
        return Response({'error': 'No tenant'}, status=status.HTTP_400_BAD_REQUEST)
    limit = int(request.GET.get('limit', 5))
    return Response(dashboard_service.get_recent_invoices(tenant_id, limit))


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard_expiring_cfdis_view(request):
    tenant_id = _tenant_id(request.user)
    if not tenant_id:
        return Response({'error': 'No tenant'}, status=status.HTTP_400_BAD_REQUEST)
    return Response(dashboard_service.get_expiring_invoices(tenant_id))


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard_pending_documents_view(request):
    tenant_id = _tenant_id(request.user)
    if not tenant_id:
        return Response({'error': 'No tenant'}, status=status.HTTP_400_BAD_REQUEST)
    return Response(dashboard_service.get_pending_documents(tenant_id))


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard_chart_data_view(request):
    tenant_id = _tenant_id(request.user)
    if not tenant_id:
        return Response({'error': 'No tenant'}, status=status.HTTP_400_BAD_REQUEST)
    chart_type = request.GET.get('type', 'monthly')
    return Response(dashboard_service.get_chart_data(tenant_id, chart_type))
