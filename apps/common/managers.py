from django.db import models
from .middleware import get_current_tenant_id


class TenantManager(models.Manager):
    def get_queryset(self):
        tenant_id = get_current_tenant_id()
        if tenant_id:
            return super().get_queryset().filter(tenant_id=tenant_id)
        return super().get_queryset()


class UnfilteredManager(models.Manager):
    pass
