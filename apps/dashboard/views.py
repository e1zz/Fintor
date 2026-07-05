from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .services.dashboard_service import DashboardService

dashboard_service = DashboardService()


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard_summary_view(request):
    data = dashboard_service.get_summary(request.user.tenant_id)
    return Response(data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard_recent_invoices_view(request):
    limit = int(request.GET.get('limit', 5))
    data = dashboard_service.get_recent_invoices(request.user.tenant_id, limit)
    return Response(data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard_expiring_cfdis_view(request):
    data = dashboard_service.get_expiring_invoices(request.user.tenant_id)
    return Response(data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard_pending_documents_view(request):
    data = dashboard_service.get_pending_documents(request.user.tenant_id)
    return Response(data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard_chart_data_view(request):
    chart_type = request.GET.get('type', 'monthly')
    data = dashboard_service.get_chart_data(request.user.tenant_id, chart_type)
    return Response(data)
