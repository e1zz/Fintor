from django.db import models


class Tenant(models.Model):
    class BusinessType(models.TextChoices):
        SERVICES = 'services', 'Services'
        COMMERCE = 'commerce', 'Commerce'
        MANUFACTURING = 'manufacturing', 'Manufacturing'
        MIXED = 'mixed', 'Mixed'

    class TaxRegime(models.TextChoices):
        RESICO_PF = 'resico_pf', 'RESICO Individual'
        PFAE = 'pfae', 'Individual Business Activity'
        PROFESSIONAL_FEES = 'professional_fees', 'Professional Fees'
        RESICO_PM = 'resico_pm', 'RESICO Corporate'

    class Status(models.TextChoices):
        ACTIVE = 'active', 'Active'
        SUSPENDED = 'suspended', 'Suspended'
        CANCELLED = 'cancelled', 'Cancelled'

    name = models.CharField(max_length=255)
    company_name = models.CharField(max_length=255, null=True, blank=True)
    rfc = models.CharField(max_length=13, unique=True)
    business_type = models.CharField(
        max_length=20, choices=BusinessType.choices, default=BusinessType.SERVICES
    )
    business_description = models.TextField(null=True, blank=True)
    tax_regime = models.CharField(
        max_length=20, choices=TaxRegime.choices, null=True, blank=True
    )
    status = models.CharField(
        max_length=20, choices=Status.choices, default=Status.ACTIVE
    )
    onboarding_completed = models.BooleanField(default=False)
    onboarding_step = models.SmallIntegerField(default=1)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    deleted_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'tenants'


class UserTenant(models.Model):
    user = models.ForeignKey('accounts.User', on_delete=models.CASCADE)
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE)

    class Meta:
        db_table = 'user_tenant'
        unique_together = [('user', 'tenant')]
