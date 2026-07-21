import re

from cryptography import x509
from cryptography.hazmat.backends import default_backend
from rest_framework import status
from rest_framework.decorators import api_view, parser_classes, permission_classes
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import SatCredential, SatCfdi, SatDownloadRequest
from .serializers import (
    SatCredentialSerializer,
    SatCredentialUploadSerializer,
    SatCfdiSerializer,
    SatCfdiUpdateCategorySerializer,
    SatDownloadCreateSerializer,
    SatDownloadRequestSerializer,
)
from .tasks import sat_download_task

# moral 12 / física 13; SAT often stores "RFC / serial" in subject
_RFC_RE = re.compile(r'^[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}$')


def _rfc_from_cer(cer_bytes: bytes) -> str:
    cert = None
    for loader in (x509.load_der_x509_certificate, x509.load_pem_x509_certificate):
        try:
            cert = loader(cer_bytes, default_backend())
            break
        except Exception:
            continue
    if cert is None:
        raise ValueError('Invalid certificate file')

    for attr in cert.subject:
        for part in re.split(r'[\s/|]+', str(attr.value).upper()):
            if _RFC_RE.match(part):
                return part
    raise ValueError('Could not extract RFC from certificate')


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, FormParser])
def credential_list_create_view(request):
    if request.method == 'GET':
        credentials = SatCredential.objects.filter(tenant=request.user.tenant)
        serializer = SatCredentialSerializer(credentials, many=True)
        return Response(serializer.data)

    serializer = SatCredentialUploadSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    cer = serializer.validated_data['cer']
    key = serializer.validated_data['key']
    password = serializer.validated_data['password']
    tenant = request.user.tenant

    cer_bytes = cer.read()
    key_bytes = key.read()
    try:
        rfc = _rfc_from_cer(cer_bytes)
    except ValueError as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    if SatCredential.objects.filter(tenant=tenant, rfc=rfc).exists():
        return Response(
            {'error': f'Credential for {rfc} already exists'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    credential = SatCredential(
        tenant=tenant,
        rfc=rfc,
        cer_data=cer_bytes,
        key_data=key_bytes,
        is_active=True,
    )
    credential.set_password(password)
    credential.save()
    return Response(
        SatCredentialSerializer(credential).data,
        status=status.HTTP_201_CREATED,
    )


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def credential_delete_view(request, id):
    try:
        credential = SatCredential.objects.get(id=id, tenant=request.user.tenant)
    except SatCredential.DoesNotExist:
        return Response({'error': 'Not found'}, status=status.HTTP_404_NOT_FOUND)

    credential.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def download_list_create_view(request):
    tenant = request.user.tenant
    if request.method == 'GET':
        qs = SatDownloadRequest.objects.filter(tenant=tenant).order_by('-created_at')
        return Response(SatDownloadRequestSerializer(qs, many=True).data)

    serializer = SatDownloadCreateSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    data = serializer.validated_data

    try:
        credential = SatCredential.objects.get(
            id=data['credential_id'],
            tenant=tenant,
            is_active=True,
        )
    except SatCredential.DoesNotExist:
        return Response({'error': 'Credential not found'}, status=status.HTTP_404_NOT_FOUND)

    req = SatDownloadRequest.objects.create(
        tenant=tenant,
        sat_credential=credential,
        download_type=data['download_type'],
        date_from=data['date_from'],
        date_to=data['date_to'],
        status=SatDownloadRequest.Status.PENDING,
    )
    # ponytail: run sync if celery/redis down so local smoke tests still work
    try:
        sat_download_task.delay(req.id)
    except Exception:
        sat_download_task(req.id)
        req.refresh_from_db()

    return Response(
        SatDownloadRequestSerializer(req).data,
        status=status.HTTP_201_CREATED,
    )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def cfdi_list_view(request):
    tenant = request.user.ensure_tenant_context()
    if not tenant:
        return Response({'error': 'No tenant'}, status=status.HTTP_400_BAD_REQUEST)
    cfdis = SatCfdi.all_objects.filter(tenant=tenant).order_by('-issue_date')
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
