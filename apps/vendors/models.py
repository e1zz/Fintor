from django.db import models

from apps.classification.models import ExpenseCategory
from apps.common.models import TenantMixin


class Vendor(TenantMixin):
    tenant = models.ForeignKey('tenants.Tenant', on_delete=models.CASCADE)
    rfc = models.CharField(max_length=13)
    name = models.CharField(max_length=255)
    default_category = models.ForeignKey(
        ExpenseCategory,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='vendors',
    )
    total_paid = models.DecimalField(
        max_digits=14, decimal_places=2, default=0
    )
    invoice_count = models.PositiveIntegerField(default=0)
    last_invoice_at = models.DateTimeField(null=True, blank=True)
    is_cost_of_sales = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'vendors'
        unique_together = [('tenant', 'rfc')]
        indexes = [
            models.Index(fields=['tenant', 'is_cost_of_sales']),
        ]
