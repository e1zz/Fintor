from django.utils import timezone

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

from .models import TicketImage, TicketExpense
from .serializers import (
    TicketImageSerializer,
    TicketExpenseSerializer,
    TicketExpenseUpdateSerializer,
    TicketConfirmSerializer,
)
from .services.parsing_service import TicketParsingService, TicketCfdiReconciliationService

ticket_service = TicketParsingService()
reconciliation_service = TicketCfdiReconciliationService()


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def ticket_upload_view(request):
    uploaded_file = request.FILES.get('file')
    if not uploaded_file:
        return Response({'error': 'No file provided'}, status=status.HTTP_400_BAD_REQUEST)
    result = ticket_service.upload_and_parse(uploaded_file, request.user)
    if isinstance(result, TicketExpense):
        serializer = TicketExpenseSerializer(result)
    else:
        serializer = TicketImageSerializer(result)
    return Response(serializer.data, status=status.HTTP_201_CREATED)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def ticket_list_view(request):
    tickets = TicketExpense.objects.filter(tenant=request.user.tenant)
    serializer = TicketExpenseSerializer(tickets, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def ticket_pending_review_view(request):
    tickets = TicketExpense.objects.filter(
        tenant=request.user.tenant,
        review_status='pending',
    )
    serializer = TicketExpenseSerializer(tickets, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def ticket_pending_count_view(request):
    count = TicketExpense.objects.filter(
        tenant=request.user.tenant,
        review_status='pending',
    ).count()
    return Response({'count': count})


@api_view(['GET', 'PATCH', 'DELETE'])
@permission_classes([IsAuthenticated])
def ticket_detail_view(request, id):
    ticket = TicketExpense.objects.get(id=id, tenant=request.user.tenant)

    if request.method == 'GET':
        return Response(TicketExpenseSerializer(ticket).data)

    if request.method == 'PATCH':
        serializer = TicketExpenseUpdateSerializer(ticket, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(TicketExpenseSerializer(ticket).data)

    ticket.deleted_at = timezone.now()
    ticket.save(update_fields=['deleted_at'])
    return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def ticket_confirm_view(request, id):
    ticket = TicketExpense.objects.get(id=id, tenant=request.user.tenant)
    serializer = TicketConfirmSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    from apps.classification.models import ExpenseCategory
    category = None
    if serializer.validated_data.get('expense_category_id'):
        category = ExpenseCategory.objects.get(
            id=serializer.validated_data['expense_category_id']
        )

    ticket_service.confirm_ticket(
        ticket,
        serializer.validated_data['bucket'],
        category,
        serializer.validated_data.get('notes'),
    )
    return Response(TicketExpenseSerializer(ticket).data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def ticket_link_cfdi_view(request, id, cfdi_id):
    from apps.sat.models import SatCfdi
    ticket = TicketExpense.objects.get(id=id, tenant=request.user.tenant)
    cfdi = SatCfdi.objects.get(id=cfdi_id, tenant=request.user.tenant)
    ticket_service.link_to_invoice(ticket, cfdi)
    return Response(TicketExpenseSerializer(ticket).data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def ticket_accept_link_view(request, id, cfdi_id):
    from apps.sat.models import SatCfdi
    ticket = TicketExpense.objects.get(id=id, tenant=request.user.tenant)
    cfdi = SatCfdi.objects.get(id=cfdi_id, tenant=request.user.tenant)
    ticket_service.link_to_invoice(ticket, cfdi)
    return Response(TicketExpenseSerializer(ticket).data)
