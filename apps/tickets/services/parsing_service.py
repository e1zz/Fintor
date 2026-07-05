import hashlib
from datetime import timedelta

from django.utils import timezone
from django.core.files.storage import default_storage

from apps.tickets.models import TicketImage, TicketExpense
from apps.vendors.models import Vendor
from services.gemini_service import GeminiService

gemini_service = GeminiService()


class TicketParsingService:

    def upload_and_parse(self, uploaded_file, user):
        file_path = default_storage.save(
            f'tickets/{user.tenant_id}/{uploaded_file.name}',
            uploaded_file,
        )
        ticket_image = TicketImage.objects.create(
            tenant=user.tenant,
            file_path=file_path,
            file_size=uploaded_file.size,
            mime_type=uploaded_file.content_type or 'image/jpeg',
            uploaded_by=user,
        )

        parsed = gemini_service.parse_ticket_image(file_path, user.tenant)

        if parsed:
            duplicate = self.find_duplicate(user.tenant_id, parsed)
            if duplicate:
                return duplicate

            vendor = self._resolve_vendor(user.tenant, parsed)

            expense = TicketExpense.objects.create(
                tenant=user.tenant,
                ticket_image=ticket_image,
                vendor=vendor,
                sender_rfc=parsed.get('sender_rfc'),
                sender_name=parsed.get('sender_name', 'Unknown'),
                ticket_date=parsed.get('ticket_date'),
                subtotal=parsed.get('subtotal', 0),
                iva=parsed.get('iva', 0),
                total=parsed.get('total', 0),
                description=parsed.get('description'),
                confidence=parsed.get('confidence', 0),
            )
            return expense

        return ticket_image

    def confirm_ticket(self, ticket, bucket, category, notes):
        ticket.bucket = bucket
        ticket.expense_category = category
        ticket.notes = notes
        ticket.review_status = 'confirmed'
        ticket.save()

    def link_to_invoice(self, ticket, cfdi):
        ticket.linked_cfdi = cfdi
        ticket.has_invoice = True
        ticket.save()

    def find_duplicate(self, tenant_id, parsed):
        threshold = timedelta(days=1)
        tolerance = 0.05

        candidates = TicketExpense.objects.filter(
            tenant_id=tenant_id,
            total__gte=parsed.get('total', 0) * (1 - tolerance),
            total__lte=parsed.get('total', 0) * (1 + tolerance),
            created_at__gte=timezone.now() - threshold,
        )
        return candidates.first()

    def _resolve_vendor(self, tenant, parsed):
        rfc = parsed.get('sender_rfc')
        if rfc:
            vendor, _ = Vendor.objects.get_or_create(
                tenant=tenant,
                rfc=rfc,
                defaults={'name': parsed.get('sender_name', '')},
            )
            return vendor
        return None


class TicketCfdiReconciliationService:

    def find_candidates_for_cfdi(self, cfdi):
        tolerance = 0.05
        date_threshold = timedelta(days=15)

        return TicketExpense.objects.filter(
            tenant=cfdi.tenant,
            total__gte=cfdi.total * (1 - tolerance),
            total__lte=cfdi.total * (1 + tolerance),
            ticket_date__gte=cfdi.issue_date - date_threshold,
            ticket_date__lte=cfdi.issue_date + date_threshold,
            linked_cfdi__isnull=True,
        )

    def suggest_link_on_new_cfdi(self, cfdi):
        candidates = self.find_candidates_for_cfdi(cfdi)
        if candidates.count() == 1:
            ticket = candidates.first()
            ticket.notes = (
                f'{ticket.notes or ""} [Suggestion: Link to CFDI {cfdi.uuid}]'
            ).strip()
            ticket.save(update_fields=['notes'])
