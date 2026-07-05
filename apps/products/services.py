from django.db.models import Q

from .models import Product


class ProductCatalogService:

    def record_usage(self, tenant_id, description, sat_key, sat_unit, unit_price):
        product, _ = Product.objects.get_or_create(
            tenant_id=tenant_id,
            description=description,
            defaults={
                'sat_product_service_key': sat_key,
                'sat_unit': sat_unit,
                'unit_price': unit_price,
            },
        )
        product.bump_usage()
        return product

    def record_quotation_items(self, tenant_id, items_data):
        products = []
        for item in items_data:
            product = self.record_usage(
                tenant_id=tenant_id,
                description=item.get('description'),
                sat_key=item.get('sat_product_service_key', ''),
                sat_unit=item.get('sat_unit', ''),
                unit_price=item.get('unit_price', 0),
            )
            products.append(product)
        return products

    def search_for_autocomplete(self, tenant_id, term, limit=10):
        return Product.objects.filter(
            tenant_id=tenant_id,
            description__icontains=term,
        ).order_by('-times_used')[:limit]
