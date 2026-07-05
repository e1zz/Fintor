from rest_framework import serializers
from .models import Vendor


class VendorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Vendor
        fields = [
            'id', 'rfc', 'name', 'default_category', 'total_paid',
            'invoice_count', 'last_invoice_at', 'is_cost_of_sales',
        ]
        read_only_fields = ['id', 'total_paid', 'invoice_count', 'last_invoice_at']


class VendorToggleCostOfSalesSerializer(serializers.Serializer):
    is_cost_of_sales = serializers.BooleanField()
