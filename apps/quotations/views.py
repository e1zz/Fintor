from django.utils import timezone

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework import status

from .models import Quotation
from .serializers import (
    QuotationSerializer,
    CreateQuotationSerializer,
    PublicQuotationSerializer,
)
from .services.quotation_service import QuotationService
from .services.pdf_service import QuotationPdfService

quotation_service = QuotationService()
pdf_service = QuotationPdfService()


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def quotation_list_create_view(request):
    if request.method == 'GET':
        quotations = Quotation.objects.filter(tenant=request.user.tenant)
        serializer = QuotationSerializer(quotations, many=True)
        return Response(serializer.data)

    serializer = CreateQuotationSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    quotation = quotation_service.create(
        request.user.tenant_id, serializer.validated_data
    )
    return Response(QuotationSerializer(quotation).data, status=status.HTTP_201_CREATED)


@api_view(['GET', 'PATCH', 'DELETE'])
@permission_classes([IsAuthenticated])
def quotation_detail_view(request, id):
    quotation = Quotation.objects.get(id=id, tenant=request.user.tenant)

    if request.method == 'GET':
        return Response(QuotationSerializer(quotation).data)

    if request.method == 'PATCH':
        try:
            quotation = quotation_service.update(quotation, request.data)
            return Response(QuotationSerializer(quotation).data)
        except ValueError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    quotation.deleted_at = timezone.now()
    quotation.save(update_fields=['deleted_at'])
    return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def quotation_send_view(request, id):
    quotation = Quotation.objects.get(id=id, tenant=request.user.tenant)
    quotation.status = 'sent'
    quotation.save(update_fields=['status'])
    return Response(QuotationSerializer(quotation).data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def quotation_convert_to_sale_view(request, id):
    quotation = Quotation.objects.get(id=id, tenant=request.user.tenant)
    quotation.status = 'sold'
    quotation.sold_at = timezone.now()
    quotation.save(update_fields=['status', 'sold_at'])
    return Response(QuotationSerializer(quotation).data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def quotation_invoice_view(request, id):
    quotation = Quotation.objects.get(id=id, tenant=request.user.tenant)
    quotation.status = 'invoiced'
    quotation.invoiced_at = timezone.now()
    quotation.save(update_fields=['status', 'invoiced_at'])
    return Response(QuotationSerializer(quotation).data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def quotation_cancel_view(request, id):
    quotation = Quotation.objects.get(id=id, tenant=request.user.tenant)
    quotation.status = 'cancelled'
    quotation.save(update_fields=['status'])
    return Response(QuotationSerializer(quotation).data)


@api_view(['GET'])
@permission_classes([AllowAny])
def public_quotation_view(request, token):
    quotation = Quotation.objects.get(public_token=token, deleted_at__isnull=True)
    serializer = PublicQuotationSerializer(quotation)
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([AllowAny])
def public_quotation_accept_view(request, token):
    quotation = Quotation.objects.get(public_token=token, deleted_at__isnull=True)
    quotation.accepted_at = timezone.now()
    quotation.save(update_fields=['accepted_at'])
    return Response({'status': 'accepted'})


@api_view(['GET'])
@permission_classes([AllowAny])
def public_quotation_pdf_view(request, token):
    quotation = Quotation.objects.get(public_token=token, deleted_at__isnull=True)
    pdf = pdf_service.render_pdf(quotation)
    from django.http import HttpResponse
    response = HttpResponse(pdf.read(), content_type='application/pdf')
    response['Content-Disposition'] = f'inline; filename={quotation.number}.pdf'
    return response
