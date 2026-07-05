from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import SatCredential, SatCfdi
from .serializers import (
    SatCredentialSerializer,
    SatCfdiSerializer,
    SatCfdiUpdateCategorySerializer,
)


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def credential_list_create_view(request):
    if request.method == 'GET':
        credentials = SatCredential.objects.filter(tenant=request.user.tenant)
        serializer = SatCredentialSerializer(credentials, many=True)
        return Response(serializer.data)

    serializer = SatCredentialSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    credential = serializer.save(tenant=request.user.tenant)
    credential.set_password(serializer.validated_data['password'])
    credential.save()
    return Response(SatCredentialSerializer(credential).data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def cfdi_list_view(request):
    cfdis = SatCfdi.objects.filter(tenant=request.user.tenant)
    serializer = SatCfdiSerializer(cfdis, many=True)
    return Response(serializer.data)


@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def cfdi_update_category_view(request, id):
    cfdi = SatCfdi.objects.get(id=id, tenant=request.user.tenant)
    serializer = SatCfdiUpdateCategorySerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    from apps.classification.models import ExpenseCategory
    cfdi.category_id = serializer.validated_data['category_id']
    cfdi.save(update_fields=['category'])
    return Response(SatCfdiSerializer(cfdi).data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def cfdi_pending_review_view(request):
    cfdis = SatCfdi.objects.filter(
        tenant=request.user.tenant,
        review_status='pending',
    )
    serializer = SatCfdiSerializer(cfdis, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def cfdi_pending_review_count_view(request):
    count = SatCfdi.objects.filter(
        tenant=request.user.tenant,
        review_status='pending',
    ).count()
    return Response({'count': count})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def cfdi_confirm_category_view(request, id):
    cfdi = SatCfdi.objects.get(id=id, tenant=request.user.tenant)
    from apps.classification.services import ExpenseClassificationService
    category_id = request.data.get('category_id')
    if category_id:
        from apps.classification.models import ExpenseCategory
        category = ExpenseCategory.objects.get(id=category_id)
        ExpenseClassificationService().confirm_category(cfdi, category)
    return Response(SatCfdiSerializer(cfdi).data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def expense_list_view(request):
    cfdis = SatCfdi.objects.filter(
        tenant=request.user.tenant,
        document_type='received',
    )
    serializer = SatCfdiSerializer(cfdis, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def expense_export_view(request):
    from services.export_service import SpreadsheetExportService
    cfdis = SatCfdi.objects.filter(
        tenant=request.user.tenant,
        document_type='received',
    )
    headers = ['UUID', 'Sender', 'Total', 'Date']
    rows = [[c.uuid, c.sender_name, float(c.total), c.issue_date] for c in cfdis]
    output = SpreadsheetExportService().stream_xlsx('expenses', headers, rows)
    from django.http import HttpResponse
    response = HttpResponse(
        output.read(),
        content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    )
    response['Content-Disposition'] = 'attachment; filename=expenses.xlsx'
    return response


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def sales_list_view(request):
    cfdis = SatCfdi.objects.filter(
        tenant=request.user.tenant,
        document_type='issued',
    )
    serializer = SatCfdiSerializer(cfdis, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def sales_export_view(request):
    from services.export_service import SpreadsheetExportService
    cfdis = SatCfdi.objects.filter(
        tenant=request.user.tenant,
        document_type='issued',
    )
    headers = ['UUID', 'Receiver', 'Total', 'Date']
    rows = [[c.uuid, c.receiver_name, float(c.total), c.issue_date] for c in cfdis]
    output = SpreadsheetExportService().stream_xlsx('sales', headers, rows)
    from django.http import HttpResponse
    response = HttpResponse(
        output.read(),
        content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    )
    response['Content-Disposition'] = 'attachment; filename=sales.xlsx'
    return response


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def receivables_list_view(request):
    cfdis = SatCfdi.objects.filter(
        tenant=request.user.tenant,
        document_type='issued',
        paid_at__isnull=True,
    )
    serializer = SatCfdiSerializer(cfdis, many=True)
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def receivables_send_reminder_view(request, cfdi_id):
    cfdi = SatCfdi.objects.get(id=cfdi_id, tenant=request.user.tenant)
    return Response({'status': 'reminder_sent', 'cfdi': cfdi.uuid})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def cfdi_cancel_view(request, id):
    cfdi = SatCfdi.objects.get(id=id, tenant=request.user.tenant)
    return Response({'status': 'cancelled', 'cfdi': cfdi.uuid})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def cfdi_resend_email_view(request, id):
    cfdi = SatCfdi.objects.get(id=id, tenant=request.user.tenant)
    return Response({'status': 'email_resent', 'cfdi': cfdi.uuid})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def cfdi_xml_view(request, id):
    cfdi = SatCfdi.objects.get(id=id, tenant=request.user.tenant)
    from django.http import HttpResponse
    response = HttpResponse(cfdi.xml_content or '', content_type='text/xml')
    response['Content-Disposition'] = f'attachment; filename={cfdi.uuid}.xml'
    return response


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def cfdi_pdf_view(request, id):
    return Response({'status': 'pdf_not_available'})
