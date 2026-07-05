from rest_framework import serializers
from .models import Tenant


class TenantSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tenant
        fields = [
            'id', 'name', 'company_name', 'rfc', 'business_type',
            'business_description', 'tax_regime', 'status',
            'onboarding_completed', 'onboarding_step',
        ]
        read_only_fields = ['id', 'status', 'onboarding_completed', 'onboarding_step']


class BusinessInfoSerializer(serializers.Serializer):
    business_description = serializers.CharField(required=False, allow_blank=True)
    business_type = serializers.ChoiceField(
        choices=Tenant.BusinessType.choices, required=False
    )
    tax_regime = serializers.ChoiceField(
        choices=Tenant.TaxRegime.choices, required=False
    )


class SatConnectSerializer(serializers.Serializer):
    rfc = serializers.CharField(max_length=13)
    cer = serializers.CharField()
    key = serializers.CharField()
    password = serializers.CharField()


class CompleteOnboardingSerializer(serializers.Serializer):
    confirmed = serializers.BooleanField()
