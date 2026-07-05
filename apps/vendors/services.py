from apps.classification.models import ExpenseCategory
from apps.classification.services import ExpenseClassificationService


class VendorCostOfSalesService:

    def mark_vendors_and_reclassify(self, tenant_id, vendor_ids):
        from apps.vendors.models import Vendor

        vendors = Vendor.objects.filter(
            tenant_id=tenant_id, id__in=vendor_ids
        )
        vendors.update(is_cost_of_sales=True)

        from apps.sat.models import SatCfdi

        cfdis = SatCfdi.objects.filter(
            tenant_id=tenant_id,
            vendor_id__in=vendor_ids,
            document_type='received',
        )
        service = ExpenseClassificationService()
        for cfdi in cfdis:
            category = service.classify(cfdi)
            if category:
                cfdi.category = category
                cfdi.save(update_fields=['category'])

    def resolve_cost_of_sales_category(self, business_type):
        slug_map = {
            'services': 'raw_materials',
            'commerce': 'inventory_merchandise',
            'manufacturing': 'raw_materials',
            'mixed': 'inventory_merchandise',
        }
        slug = slug_map.get(business_type, 'inventory_merchandise')
        return ExpenseCategory.objects.filter(slug=slug).first()
