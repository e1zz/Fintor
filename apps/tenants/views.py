from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

from apps.vendors.models import Vendor
from apps.vendors.serializers import VendorSerializer
from apps.vendors.services import VendorCostOfSalesService
from .serializers import (
    TenantSerializer, BusinessInfoSerializer,
    SatConnectSerializer, CompleteOnboardingSerializer,
)
from .models import Tenant

vendor_service = VendorCostOfSalesService()


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def top_vendors_view(request):
    vendors = Vendor.objects.filter(
        tenant=request.user.tenant
    ).order_by('-total_paid')[:10]
    serializer = VendorSerializer(vendors, many=True)
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def mark_cost_of_sales_vendors_view(request):
    vendor_ids = request.data.get('vendor_ids', [])
    vendor_service.mark_vendors_and_reclassify(
        request.user.tenant_id, vendor_ids
    )
    return Response({'status': 'ok'})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def business_info_view(request):
    serializer = BusinessInfoSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    tenant = request.user.tenant
    for key, value in serializer.validated_data.items():
        setattr(tenant, key, value)
    tenant.onboarding_step = max(tenant.onboarding_step, 2)
    tenant.save()
    return Response(TenantSerializer(tenant).data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def sat_connect_view(request):
    serializer = SatConnectSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    tenant = request.user.tenant
    tenant.onboarding_step = max(tenant.onboarding_step, 3)
    tenant.save()
    return Response({'status': 'processing'})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def sat_status_view(request):
    from apps.sat.models import SatCfdi
    count = SatCfdi.objects.filter(
        tenant=request.user.tenant
    ).count()
    return Response({
        'status': 'completed' if count > 0 else 'idle',
        'total_estimated': count,
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def complete_onboarding_view(request):
    serializer = CompleteOnboardingSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    if serializer.validated_data.get('confirmed'):
        tenant = request.user.tenant
        tenant.onboarding_completed = True
        tenant.onboarding_step = 4
        tenant.save()
        return Response({'status': 'completed'})
    return Response({'error': 'Not confirmed'}, status=status.HTTP_400_BAD_REQUEST)
