from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.db import models


class UserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('The Email field must be set')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        return self.create_user(email, password, **extra_fields)


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

    objects = UserManager()

    def accessible_tenant_ids(self):
        tenant_ids = set(self.tenants.values_list('id', flat=True))
        if self.tenant_id:
            tenant_ids.add(self.tenant_id)
        return list(tenant_ids)

    def get_effective_tenant(self):
        if self.tenant_id:
            return self.tenant

        return self.tenants.order_by('id').first()

    def ensure_tenant_context(self):
        tenant = self.get_effective_tenant()
        if tenant and self.tenant_id != tenant.id:
            self.tenant = tenant
            self.save(update_fields=['tenant'])
        return tenant
