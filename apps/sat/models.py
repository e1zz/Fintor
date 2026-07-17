from django.db import models

from apps.classification.models import ExpenseCategory
from apps.common.models import TenantMixin
from apps.vendors.models import Vendor


class SatCredential(TenantMixin):
    tenant = models.ForeignKey('tenants.Tenant', on_delete=models.CASCADE)
    rfc = models.CharField(max_length=13)
    cer_data = models.BinaryField()
    key_data = models.BinaryField()
    password_encrypted = models.TextField()
    valid_until = models.DateField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'sat_credentials'
        unique_together = [('tenant', 'rfc')]

    def get_password(self):
        from django.conf import settings
        from cryptography.fernet import Fernet
        f = Fernet(settings.SAT_ENCRYPTION_KEY)
        return f.decrypt(self.password_encrypted.encode()).decode()

    def set_password(self, password):
        from django.conf import settings
        from cryptography.fernet import Fernet
        f = Fernet(settings.SAT_ENCRYPTION_KEY)
        self.password_encrypted = f.encrypt(password.encode()).decode()


class SatDownloadRequest(TenantMixin):
    class DownloadType(models.TextChoices):
        ISSUED = 'issued', 'Issued'
        RECEIVED = 'received', 'Received'

    class Status(models.TextChoices):
        PENDING = 'pending', 'Pending'
        QUERYING = 'querying', 'Querying'
        VERIFYING = 'verifying', 'Verifying'
        DOWNLOADING = 'downloading', 'Downloading'
        FINISHED = 'finished', 'Finished'
        ERROR = 'error', 'Error'

    tenant = models.ForeignKey('tenants.Tenant', on_delete=models.CASCADE)
    sat_credential = models.ForeignKey(
        SatCredential, on_delete=models.CASCADE, related_name='download_requests'
    )
    request_id = models.CharField(max_length=255, null=True, blank=True)
    download_type = models.CharField(
        max_length=20, choices=DownloadType.choices
    )
    status = models.CharField(
        max_length=20, choices=Status.choices, default=Status.PENDING
    )
    date_from = models.DateField()
    date_to = models.DateField()
    packages_count = models.PositiveIntegerField(default=0)
    cfdis_count = models.PositiveIntegerField(default=0)
    error_message = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'sat_download_requests'


class SatCfdi(TenantMixin):
    class DocumentType(models.TextChoices):
        ISSUED = 'issued', 'Issued'
        RECEIVED = 'received', 'Received'

    class ReviewStatus(models.TextChoices):
        NONE = 'none', 'Unreviewed'
        PENDING = 'pending', 'Pending'
        CONFIRMED = 'confirmed', 'Confirmed'

    tenant = models.ForeignKey('tenants.Tenant', on_delete=models.CASCADE)
    sat_download_request = models.ForeignKey(
        SatDownloadRequest,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='cfdis',
    )
    uuid = models.UUIDField(unique=True)
    document_type = models.CharField(
        max_length=20, choices=DocumentType.choices
    )
    sender_rfc = models.CharField(max_length=13)
    sender_name = models.CharField(max_length=255)
    receiver_rfc = models.CharField(max_length=13)
    receiver_name = models.CharField(max_length=255)
    payment_method = models.CharField(max_length=2, null=True, blank=True)
    payment_method_type = models.CharField(max_length=3, null=True, blank=True)
    cfdi_usage = models.CharField(max_length=3, null=True, blank=True)
    issue_date = models.DateTimeField(null=True, blank=True)
    document_subtype = models.CharField(max_length=1, null=True, blank=True)
    subtotal = models.DecimalField(
        max_digits=14, decimal_places=2, default=0
    )
    total = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    iva_withholding = models.DecimalField(
        max_digits=14, decimal_places=2, default=0
    )
    isr_withholding = models.DecimalField(
        max_digits=14, decimal_places=2, default=0
    )
    currency = models.CharField(max_length=3, default='MXN')
    status = models.CharField(max_length=20, null=True, blank=True)
    paid_at = models.DateTimeField(null=True, blank=True)
    concepts = models.JSONField(null=True, blank=True)
    xml_content = models.TextField(null=True, blank=True)
    category = models.ForeignKey(
        ExpenseCategory,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='cfdis',
    )
    category_confirmed = models.BooleanField(default=False)
    vendor = models.ForeignKey(
        Vendor,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='cfdis',
    )
    review_status = models.CharField(
        max_length=20,
        choices=ReviewStatus.choices,
        default=ReviewStatus.NONE,
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'sat_cfdis'
        indexes = [
            models.Index(fields=['tenant', 'document_type']),
            models.Index(fields=['tenant', 'sender_rfc']),
            models.Index(fields=['tenant', 'issue_date']),
            models.Index(fields=['tenant', 'document_type', 'paid_at']),
            models.Index(fields=['tenant', 'review_status']),
        ]
