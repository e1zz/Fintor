import re

from apps.classification.models import (
    ExpenseCategory,
    VendorRule,
    SatClassCategoryMap,
    VendorCategoryCache,
)
from services.gemini_service import GeminiService

gemini_service = GeminiService()


class ExpenseClassificationService:

    def classify(self, cfdi):
        if cfdi.vendor and cfdi.vendor.is_cost_of_sales:
            return self._resolve_cost_of_sales_category(cfdi.tenant.business_type)

        if cfdi.document_subtype == 'N':
            return ExpenseCategory.objects.filter(slug='salaries').first()

        for concept in (cfdi.concepts or []):
            key = concept.get('clave_prod_serv')
            if key:
                mapping = SatClassCategoryMap.objects.filter(
                    sat_class_6digits=key[:6]
                ).first()
                if mapping:
                    return ExpenseCategory.objects.filter(
                        slug=mapping.category_slug
                    ).first()

        rule = VendorRule.objects.filter(rfc=cfdi.sender_rfc).first()
        if not rule:
            for rule in VendorRule.objects.exclude(name_pattern__isnull=True):
                if re.search(rule.name_pattern, cfdi.sender_name, re.IGNORECASE):
                    return rule.category

        cache = VendorCategoryCache.objects.filter(
            tenant=cfdi.tenant, sender_rfc=cfdi.sender_rfc
        ).first()
        if cache and cache.confidence >= 0.7:
            return cache.category

        return gemini_service.classify(cfdi)

    def confirm_category(self, cfdi, category):
        cfdi.category = category
        cfdi.category_confirmed = True
        cfdi.review_status = 'confirmed'
        cfdi.save(update_fields=['category', 'category_confirmed', 'review_status'])

        cache, _ = VendorCategoryCache.objects.get_or_create(
            tenant=cfdi.tenant,
            sender_rfc=cfdi.sender_rfc,
            defaults={
                'sender_name': cfdi.sender_name,
                'category': category,
            },
        )
        cache.times_confirmed += 1
        cache.confidence = min(1.0, cache.times_confirmed * 0.15)
        cache.category = category
        cache.save()

    def maybe_mark_for_review(self, cfdi):
        if cfdi.category_id and not cfdi.category_confirmed:
            cfdi.review_status = 'pending'
            cfdi.save(update_fields=['review_status'])

    def _resolve_cost_of_sales_category(self, business_type):
        slug = 'inventory_merchandise' if business_type in ('commerce', 'mixed') else 'raw_materials'
        return ExpenseCategory.objects.filter(slug=slug).first()
