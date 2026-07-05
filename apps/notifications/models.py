from django.db import models
from django.utils import timezone

from apps.common.models import TenantMixin


class Notification(TenantMixin):
    tenant = models.ForeignKey('tenants.Tenant', on_delete=models.CASCADE)
    user = models.ForeignKey(
        'accounts.User',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='notifications',
    )
    type = models.CharField(max_length=50)
    title = models.CharField(max_length=255)
    body = models.TextField()
    data = models.JSONField(null=True, blank=True)
    read_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'notifications'
        indexes = [
            models.Index(fields=['tenant', 'read_at']),
            models.Index(fields=['tenant', 'user', 'read_at']),
            models.Index(fields=['tenant', 'type', 'created_at']),
        ]

    def mark_as_read(self):
        if not self.read_at:
            self.read_at = timezone.now()
            self.save(update_fields=['read_at', 'updated_at'])
