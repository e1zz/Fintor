import secrets
from datetime import datetime

from django.db import models

from apps.common.models import TenantMixin
from apps.customers.models import Customer


class Quotation(TenantMixin):
    class Status(models.TextChoices):
        DRAFT = 'draft', 'Draft'
        SENT = 'sent', 'Sent'
        SOLD = 'sold', 'Sold'
        INVOICED = 'invoiced', 'Invoiced'
        CANCELLED = 'cancelled', 'Cancelled'

    tenant = models.ForeignKey('tenants.Tenant', on_delete=models.CASCADE)
    customer = models.ForeignKey(
        Customer, on_delete=models.CASCADE, related_name='quotations'
    )
    number = models.CharField(max_length=20)
    status = models.CharField(
        max_length=20, choices=Status.choices, default=Status.DRAFT
    )
    subtotal = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    iva = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    customer_message = models.TextField(null=True, blank=True)
    public_token = models.CharField(max_length=64, unique=True)
    valid_until = models.DateField(null=True, blank=True)
    viewed_at = models.DateTimeField(null=True, blank=True)
    accepted_at = models.DateTimeField(null=True, blank=True)
    sold_at = models.DateTimeField(null=True, blank=True)
    invoiced_at = models.DateTimeField(null=True, blank=True)
    cfdi = models.ForeignKey(
        'sat.SatCfdi',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='quotations',
    )
    deleted_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'quotations'
        unique_together = [('tenant', 'number')]

    def save(self, *args, **kwargs):
        if not self.number:
            self.number = self.generate_number(self.tenant_id)
        if not self.public_token:
            self.public_token = self.generate_public_token()
        super().save(*args, **kwargs)

    @staticmethod
    def generate_number(tenant_id):
        year_month = datetime.now().strftime('%y%m')
        prefix = f'QTN-{year_month}-'
        last = (
            Quotation.objects.filter(tenant_id=tenant_id, number__startswith=prefix)
            .order_by('-number')
            .first()
        )
        num = int(last.number.split('-')[-1]) + 1 if last else 1
        return f"{prefix}{num:04d}"

    @staticmethod
    def generate_public_token():
        return secrets.token_urlsafe(48)

    def is_editable(self):
        return self.status == self.Status.DRAFT


class QuotationItem(models.Model):
    quotation = models.ForeignKey(
        Quotation, on_delete=models.CASCADE, related_name='items'
    )
    product = models.ForeignKey(
        'products.Product',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='quotation_items',
    )
    description = models.CharField(max_length=255)
    quantity = models.DecimalField(max_digits=12, decimal_places=2)
    unit_price = models.DecimalField(max_digits=12, decimal_places=2)
    discount = models.DecimalField(
        max_digits=12, decimal_places=2, default=0
    )
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    iva = models.DecimalField(max_digits=12, decimal_places=2)
    total = models.DecimalField(max_digits=12, decimal_places=2)
    sat_product_service_key = models.CharField(
        max_length=8, null=True, blank=True
    )
    sat_unit = models.CharField(max_length=10, null=True, blank=True)
    sort_order = models.SmallIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'quotation_items'
        ordering = ['sort_order']
