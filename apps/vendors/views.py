from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Vendor
from .serializers import VendorSerializer, VendorToggleCostOfSalesSerializer


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def vendor_list_view(request):
    vendors = Vendor.objects.filter(tenant=request.user.tenant)
    serializer = VendorSerializer(vendors, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def vendor_export_view(request):
    from services.export_service import SpreadsheetExportService
    vendors = Vendor.objects.filter(tenant=request.user.tenant)
    headers = ['RFC', 'Name', 'Total Paid', 'Invoices', 'Cost of Sales']
    rows = [[v.rfc, v.name, float(v.total_paid), v.invoice_count, v.is_cost_of_sales] for v in vendors]
    output = SpreadsheetExportService().stream_xlsx('vendors', headers, rows)
    from django.http import HttpResponse
    response = HttpResponse(
        output.read(),
        content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    )
    response['Content-Disposition'] = 'attachment; filename=vendors.xlsx'
    return response


@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def vendor_toggle_cost_of_sales_view(request, id):
    vendor = Vendor.objects.get(id=id, tenant=request.user.tenant)
    serializer = VendorToggleCostOfSalesSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    vendor.is_cost_of_sales = serializer.validated_data['is_cost_of_sales']
    vendor.save(update_fields=['is_cost_of_sales'])
    return Response(VendorSerializer(vendor).data)
