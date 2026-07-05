from django.db import models

from apps.common.models import TenantMixin


class TicketImage(TenantMixin):
    tenant = models.ForeignKey('tenants.Tenant', on_delete=models.CASCADE)
    file_path = models.CharField(max_length=255)
    file_size = models.BigIntegerField()
    mime_type = models.CharField(max_length=50)
    uploaded_by = models.ForeignKey(
        'accounts.User', on_delete=models.CASCADE, related_name='ticket_images'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'ticket_images'
        indexes = [
            models.Index(fields=['tenant', 'created_at']),
        ]


class TicketExpense(TenantMixin):
    class Bucket(models.TextChoices):
        COMPANY_DEDUCTIBLE = 'company_deductible', 'Company Deductible'
        COMPANY_NON_DEDUCTIBLE = 'company_non_deductible', 'Company Non Deductible'
        PERSONAL = 'personal', 'Personal'

    class ReviewStatus(models.TextChoices):
        NONE = 'none', 'Unreviewed'
        PENDING = 'pending', 'Pending'
        CONFIRMED = 'confirmed', 'Confirmed'

    tenant = models.ForeignKey('tenants.Tenant', on_delete=models.CASCADE)
    ticket_image = models.ForeignKey(
        TicketImage, on_delete=models.CASCADE, related_name='ticket_expenses'
    )
    vendor = models.ForeignKey(
        'vendors.Vendor',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='ticket_expenses',
    )
    sender_rfc = models.CharField(max_length=13, null=True, blank=True)
    sender_name = models.CharField(max_length=255)
    ticket_date = models.DateField(null=True, blank=True)
    subtotal = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    iva = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    description = models.TextField(null=True, blank=True)
    bucket = models.CharField(
        max_length=30,
        choices=Bucket.choices,
        default=Bucket.COMPANY_NON_DEDUCTIBLE,
    )
    expense_category = models.ForeignKey(
        'classification.ExpenseCategory',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='ticket_expenses',
    )
    has_invoice = models.BooleanField(default=False)
    linked_cfdi = models.ForeignKey(
        'sat.SatCfdi',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='linked_tickets',
    )
    confidence = models.FloatField(default=0)
    review_status = models.CharField(
        max_length=20,
        choices=ReviewStatus.choices,
        default=ReviewStatus.NONE,
    )
    notes = models.TextField(null=True, blank=True)
    deleted_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'ticket_expenses'
        indexes = [
            models.Index(fields=['tenant', 'bucket']),
            models.Index(fields=['tenant', 'review_status']),
            models.Index(fields=['tenant', 'ticket_date']),
            models.Index(fields=['tenant', 'has_invoice']),
            models.Index(fields=['tenant', 'vendor']),
        ]
