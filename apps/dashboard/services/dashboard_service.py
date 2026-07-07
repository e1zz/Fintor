from datetime import datetime, timedelta

from django.utils import timezone
from django.db.models import Sum, Count, Q

from apps.sat.models import SatCfdi
from apps.classification.models import ExpenseCategory, VendorCategoryCache


class DashboardService:

    def get_summary(self, tenant_id, month=None):
        return self.business(tenant_id, month)
    def get_recent_invoices(self, tenant_id, limit=5):
        invoices = SatCfdi.objects.filter(tenant_id=tenant_id).order_by('-issue_date')[:limit]
        return [{'id': str(i.id), 'number': i.series or '', 'total': float(i.total)} for i in invoices]
    
    def get_chart_data(self, tenant_id, chart_type='monthly'):
        now = timezone.now()
        start = self._month_start(month=now)
        end = self._month_end(start)

        if chart_type == 'monthly':
            data = SatCfdi.objects.filter(
                tenant_id=tenant_id,
                issue_date__range=(start, end)
            ).annotate(month=timezone.localtime('issue_date').month).values('month').annotate(
                total_sales=Sum('total', filter=Q(document_type='issued')),
                total_expenses=Sum('total', filter=Q(document_type='received'))
            ).order_by('month')
            return list(data)
        else:
            return []

    def get_expiring_invoices(self, tenant_id, days=30):
        now = timezone.now()
        future_date = now + timedelta(days=days)
        invoices = SatCfdi.objects.filter(
            tenant_id=tenant_id,
            due_date__range=(now, future_date)
        ).order_by('due_date')
        return [{'id': str(i.id), 'number': i.series or '', 'due_date': i.due_date.isoformat(), 'total': float(i.total)} for i in invoices]

    def get_pending_documents(self, tenant_id):
        pending_invoices = SatCfdi.objects.filter(
            tenant_id=tenant_id,
            document_type='issued',
            status='pending'
        ).count()

        pending_expenses = SatCfdi.objects.filter(
            tenant_id=tenant_id,
            document_type='received',
            status='pending'
        ).count()

        return {
            'pending_invoices': pending_invoices,
            'pending_expenses': pending_expenses
        }

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
