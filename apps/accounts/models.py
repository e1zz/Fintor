from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    username = None
    email = models.EmailField(unique=True)
    tenant = models.ForeignKey(
        'tenants.Tenant', null=True, blank=True, on_delete=models.SET_NULL
    )
    tenants = models.ManyToManyField(
        'tenants.Tenant', through='tenants.UserTenant', related_name='users'
    )

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['first_name', 'last_name']

    def accessible_tenant_ids(self):
        tenant_ids = set(self.tenants.values_list('id', flat=True))
        if self.tenant_id:
            tenant_ids.add(self.tenant_id)
        return list(tenant_ids)
