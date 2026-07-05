from django.db.models import F

from django.db import models

from apps.common.models import TenantMixin


class Product(TenantMixin):
    tenant = models.ForeignKey('tenants.Tenant', on_delete=models.CASCADE)
    description = models.CharField(max_length=255)
    sat_product_service_key = models.CharField(max_length=8)
    sat_unit = models.CharField(max_length=10, null=True, blank=True)
    unit_price = models.DecimalField(
        max_digits=12, decimal_places=2, default=0
    )
    applicable_iva = models.BooleanField(default=True)
    times_used = models.PositiveIntegerField(default=0)
    deleted_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'products_catalog'

    def bump_usage(self):
        Product.objects.filter(pk=self.pk).update(times_used=F('times_used') + 1)
        self.times_used += 1
