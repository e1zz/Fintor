from django.db import models

from apps.common.models import TenantMixin


class Customer(TenantMixin):
    tenant = models.ForeignKey('tenants.Tenant', on_delete=models.CASCADE)
    rfc = models.CharField(max_length=13)
    business_name = models.CharField(max_length=255)
    email = models.EmailField(null=True, blank=True)
    phone = models.CharField(max_length=30, null=True, blank=True)
    default_cfdi_usage = models.CharField(max_length=5, null=True, blank=True)
    tax_regime = models.CharField(max_length=5, null=True, blank=True)
    postal_code = models.CharField(max_length=10, null=True, blank=True)
    tax_address = models.JSONField(null=True, blank=True)
    notes = models.TextField(null=True, blank=True)
    deleted_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'customers'
        unique_together = [('tenant', 'rfc')]
