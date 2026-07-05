from django.db import models

from apps.common.models import TenantMixin


class ExpenseCategory(models.Model):
    ...
    class Meta:
        db_table = 'expense_categories'


class VendorRule(models.Model):
    ...
    class Meta:
        db_table = 'vendor_rules'


class SatClassCategoryMap(models.Model):
    ...
    class Meta:
        db_table = 'sat_class_category_map'


class VendorCategoryCache(TenantMixin):
    tenant = models.ForeignKey('tenants.Tenant', on_delete=models.CASCADE)
    category = models.ForeignKey(
        ExpenseCategory, on_delete=models.CASCADE, related_name='vendor_caches'
    )
    sender_rfc = models.CharField(max_length=13)
    sender_name = models.CharField(max_length=255)
    confidence = models.FloatField(default=0)
    times_confirmed = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'vendor_category_cache'
        unique_together = [('tenant', 'sender_rfc')]
