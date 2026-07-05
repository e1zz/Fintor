from django.utils import timezone
from django.db.models import Q, Sum

from apps.sat.models import SatCfdi
from apps.notifications.models import Notification


class NotificationGeneratorService:

    def run_for_all_tenants(self):
        from apps.tenants.models import Tenant
        for tenant in Tenant.objects.filter(onboarding_completed=True):
            self.run_for_tenant(tenant)

    def run_for_tenant(self, tenant):
        self._overdue_receivables(tenant)
        self._unusual_expenses(tenant)
        self._late_invoice_links(tenant)

    def _overdue_receivables(self, tenant):
        overdue = SatCfdi.objects.filter(
            tenant=tenant,
            document_type='issued',
            paid_at__isnull=True,
            issue_date__lt=timezone.now() - timezone.timedelta(days=30),
        )
        count = overdue.count()
        if count > 0:
            self._create_notification(
                tenant, None,
                'overdue_receivables',
                'Overdue Receivables',
                f'You have {count} overdue invoice(s).',
            )

    def _unusual_expenses(self, tenant):
        pass

    def _late_invoice_links(self, tenant):
        pass

    def _create_notification(self, tenant, user, type, title, body, data=None):
        Notification.objects.create(
            tenant=tenant,
            user=user,
            type=type,
            title=title,
            body=body,
            data=data or {},
        )
