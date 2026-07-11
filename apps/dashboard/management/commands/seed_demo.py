from datetime import timedelta
from decimal import Decimal
from uuid import uuid4

from django.core.management.base import BaseCommand, CommandError
from django.utils import timezone

from apps.accounts.models import User
from apps.sat.models import SatCfdi
from apps.tenants.models import Tenant


class Command(BaseCommand):
    help = 'Seed demo CFDIs so the dashboard UI has numbers to show'

    def add_arguments(self, parser):
        parser.add_argument(
            '--email',
            type=str,
            help='User email whose tenant receives seed data (default: first user with a tenant)',
        )
        parser.add_argument(
            '--clear',
            action='store_true',
            help='Delete existing CFDIs for that tenant before seeding',
        )

    def handle(self, *args, **options):
        tenant = self._resolve_tenant(options.get('email'))
        if options['clear']:
            deleted, _ = SatCfdi.all_objects.filter(tenant=tenant).delete()
            self.stdout.write(f'Cleared {deleted} CFDIs for tenant {tenant.id}')

        now = timezone.now()
        rfc = (tenant.rfc or 'XAXX010101000')[:13]
        company = tenant.company_name or tenant.name or 'Demo Co'

        # Keep all dates inside current month so KPIs light up
        issued = [
            (Decimal('12500.00'), 'Cliente Alpha SA', 1),
            (Decimal('8300.50'), 'Cliente Beta', 2),
            (Decimal('15200.00'), 'Cliente Gamma', 3),
            (Decimal('4100.00'), 'Cliente Delta', 4),
            (Decimal('9900.00'), 'Cliente Epsilon', 5),
        ]
        received = [
            (Decimal('3200.00'), 'Proveedor Office', 1),
            (Decimal('1850.75'), 'Proveedor Cloud', 2),
            (Decimal('5400.00'), 'Proveedor Rent', 3),
            (Decimal('950.00'), 'Proveedor Ads', 4),
        ]

        created = 0
        for total, name, days_ago in issued:
            SatCfdi.all_objects.create(
                tenant=tenant,
                uuid=uuid4(),
                document_type=SatCfdi.DocumentType.ISSUED,
                sender_rfc=rfc,
                sender_name=company,
                receiver_rfc='XAXX010101000',
                receiver_name=name,
                issue_date=now - timedelta(days=days_ago),
                subtotal=total,
                total=total,
                status='active',
            )
            created += 1

        for total, name, days_ago in received:
            SatCfdi.all_objects.create(
                tenant=tenant,
                uuid=uuid4(),
                document_type=SatCfdi.DocumentType.RECEIVED,
                sender_rfc='XEXX010101000',
                sender_name=name,
                receiver_rfc=rfc,
                receiver_name=company,
                issue_date=now - timedelta(days=days_ago),
                subtotal=total,
                total=total,
                status='active',
            )
            created += 1

        sales = sum(t for t, _, _ in issued)
        expenses = sum(t for t, _, _ in received)
        self.stdout.write(
            self.style.SUCCESS(
                f'Seeded {created} CFDIs for tenant={tenant.id} ({tenant.name}). '
                f'Sales≈{sales} Expenses≈{expenses}'
            )
        )

    def _resolve_tenant(self, email):
        from apps.tenants.models import UserTenant

        if email:
            try:
                user = User.objects.get(email=email)
            except User.DoesNotExist as exc:
                raise CommandError(f'No user with email {email}') from exc
            tenant = user.ensure_tenant_context()
            if not tenant:
                tenant = Tenant.objects.order_by('id').first()
                if not tenant:
                    raise CommandError(f'User {email} has no tenant and none exist')
                user.tenant = tenant
                user.save(update_fields=['tenant'])
                UserTenant.objects.get_or_create(user=user, tenant=tenant)
                self.stdout.write(f'Linked {email} → tenant {tenant.id}')
            return tenant

        user = User.objects.filter(tenant__isnull=False).order_by('id').first()
        if user:
            return user.tenant

        tenant = Tenant.objects.order_by('id').first()
        if not tenant:
            raise CommandError('No tenants found — register a user first')

        # Attach tenant-less non-superusers to the only tenant (dev convenience)
        for u in User.objects.filter(tenant__isnull=True, is_superuser=False):
            u.tenant = tenant
            u.save(update_fields=['tenant'])
            UserTenant.objects.get_or_create(user=u, tenant=tenant)
            self.stdout.write(f'Linked {u.email} → tenant {tenant.id}')

        return tenant
