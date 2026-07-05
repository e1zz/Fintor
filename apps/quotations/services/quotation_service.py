from decimal import Decimal

from django.db import transaction

from apps.customers.models import Customer
from apps.products.services import ProductCatalogService
from apps.quotations.models import Quotation, QuotationItem

product_catalog = ProductCatalogService()

IVA_RATE = Decimal('0.16')


class QuotationService:

    @transaction.atomic
    def create(self, tenant_id, data):
        customer = Customer.objects.get(
            id=data['customer_id'], tenant_id=tenant_id
        )
        quotation = Quotation.objects.create(
            tenant_id=tenant_id,
            customer=customer,
        )

        self.sync_items(quotation, data['items'])
        self.recalculate_totals(quotation)

        product_catalog.record_quotation_items(tenant_id, data['items'])

        return quotation

    def update(self, quotation, data):
        if not quotation.is_editable():
            raise ValueError('Only drafts can be updated')

        if 'customer_id' in data:
            quotation.customer_id = data['customer_id']

        if 'customer_message' in data:
            quotation.customer_message = data['customer_message']

        if 'valid_until' in data:
            quotation.valid_until = data['valid_until']

        quotation.save()

        if 'items' in data:
            quotation.items.all().delete()
            self.sync_items(quotation, data['items'])
            self.recalculate_totals(quotation)

        return quotation

    def sync_items(self, quotation, items_data):
        for i, item in enumerate(items_data):
            quantity = Decimal(str(item['quantity']))
            unit_price = Decimal(str(item['unit_price']))
            discount = Decimal(str(item.get('discount', 0)))
            amount = (quantity * unit_price) - discount
            iva = amount * IVA_RATE
            total = amount + iva

            QuotationItem.objects.create(
                quotation=quotation,
                product_id=item.get('product_id'),
                description=item['description'],
                quantity=quantity,
                unit_price=unit_price,
                discount=discount,
                amount=amount,
                iva=iva,
                total=total,
                sat_product_service_key=item.get('sat_product_service_key', ''),
                sat_unit=item.get('sat_unit', ''),
                sort_order=i,
            )

    def recalculate_totals(self, quotation):
        items = quotation.items.all()
        subtotal = sum(item.amount for item in items)
        iva = sum(item.iva for item in items)
        total = subtotal + iva

        quotation.subtotal = subtotal
        quotation.iva = iva
        quotation.total = total
        quotation.save(update_fields=['subtotal', 'iva', 'total'])
