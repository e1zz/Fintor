from django.db import models

from .managers import TenantManager, UnfilteredManager
from .middleware import get_current_tenant_id


class TenantMixin(models.Model):
    tenant = models.ForeignKey('tenants.Tenant', on_delete=models.CASCADE)
    objects = TenantManager()
    all_objects = UnfilteredManager()

    class Meta:
        abstract = True

    def save(self, *args, **kwargs):
        if not self.tenant_id:
            self.tenant_id = get_current_tenant_id()
        super().save(*args, **kwargs)
