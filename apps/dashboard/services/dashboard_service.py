from datetime import datetime, timedelta

from django.utils import timezone
from django.db.models import Sum, Count, Q

from apps.sat.models import SatCfdi
from apps.classification.models import ExpenseCategory, VendorCategoryCache


class DashboardService:

    def business(self, tenant_id, month=None):
        now = timezone.now()
        start = self._month_start(month or now)
        end = self._month_end(start)

        sales = SatCfdi.objects.filter(
            tenant_id=tenant_id,
            document_type='issued',
            issue_date__range=(start, end),
        ).aggregate(total=Sum('total'))['total'] or 0

        expenses = SatCfdi.objects.filter(
            tenant_id=tenant_id,
            document_type='received',
            issue_date__range=(start, end),
        ).aggregate(total=Sum('total'))['total'] or 0

        return {
            'period': {'start': start.isoformat(), 'end': end.isoformat()},
            'sales': float(sales),
            'expenses': float(expenses),
            'profit': float(sales - expenses),
        }

    def fiscal(self, tenant_id, month=None):
        return {'iva': 0, 'isr': 0, 'status': 'estimated'}

    def personal(self, tenant_id, month=None):
        return {'total_personal': 0, 'percentage': 0}

    def _month_start(self, dt):
        return dt.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

    def _month_end(self, start):
        next_month = start.replace(month=start.month % 12 + 1) if start.month < 12 else start.replace(year=start.year + 1, month=1)
        return next_month - timedelta(seconds=1)
