from django.utils import timezone

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

from .models import Customer
from .serializers import CustomerSerializer


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def customer_list_create_view(request):
    if request.method == 'GET':
        customers = Customer.objects.filter(tenant=request.user.tenant)
        serializer = CustomerSerializer(customers, many=True)
        return Response(serializer.data)

    serializer = CustomerSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    serializer.save(tenant=request.user.tenant)
    return Response(serializer.data, status=status.HTTP_201_CREATED)


@api_view(['GET', 'PATCH', 'DELETE'])
@permission_classes([IsAuthenticated])
def customer_detail_view(request, id):
    customer = Customer.objects.get(id=id, tenant=request.user.tenant)

    if request.method == 'GET':
        return Response(CustomerSerializer(customer).data)

    if request.method == 'PATCH':
        serializer = CustomerSerializer(customer, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(CustomerSerializer(customer).data)

    customer.deleted_at = timezone.now()
    customer.save(update_fields=['deleted_at'])
    return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def customer_search_view(request):
    term = request.GET.get('q', '')
    customers = Customer.objects.filter(
        tenant=request.user.tenant,
        business_name__icontains=term,
    )[:20]
    serializer = CustomerSerializer(customers, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def customer_from_cfdis_view(request):
    from apps.sat.models import SatCfdi
    cfdis = SatCfdi.objects.filter(
        tenant=request.user.tenant,
        document_type='issued',
    ).values('receiver_rfc', 'receiver_name').distinct()
    return Response(list(cfdis))


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def customer_export_view(request):
    from services.export_service import SpreadsheetExportService
    customers = Customer.objects.filter(tenant=request.user.tenant)
    headers = ['RFC', 'Business Name', 'Email', 'Phone']
    rows = [[c.rfc, c.business_name, c.email, c.phone] for c in customers]
    output = SpreadsheetExportService().stream_xlsx('customers', headers, rows)
    from django.http import HttpResponse
    response = HttpResponse(
        output.read(),
        content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    )
    response['Content-Disposition'] = 'attachment; filename=customers.xlsx'
    return response
