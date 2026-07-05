from rest_framework import serializers
from .models import Quotation, QuotationItem


class QuotationItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = QuotationItem
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']


class QuotationSerializer(serializers.ModelSerializer):
    items = QuotationItemSerializer(many=True, read_only=True)

    class Meta:
        model = Quotation
        fields = '__all__'
        read_only_fields = [
            'id', 'tenant', 'number', 'public_token',
            'viewed_at', 'accepted_at', 'sold_at', 'invoiced_at',
            'created_at', 'updated_at',
        ]


class CreateQuotationItemSerializer(serializers.Serializer):
    product_id = serializers.IntegerField(required=False, allow_null=True)
    description = serializers.CharField(max_length=255)
    quantity = serializers.DecimalField(max_digits=12, decimal_places=2)
    unit_price = serializers.DecimalField(max_digits=12, decimal_places=2)
    discount = serializers.DecimalField(
        max_digits=12, decimal_places=2, required=False, default=0
    )
    sat_product_service_key = serializers.CharField(
        max_length=8, required=False, allow_blank=True
    )
    sat_unit = serializers.CharField(
        max_length=10, required=False, allow_blank=True
    )


class CreateQuotationSerializer(serializers.Serializer):
    customer_id = serializers.IntegerField()
    items = CreateQuotationItemSerializer(many=True)
    customer_message = serializers.CharField(
        required=False, allow_blank=True, allow_null=True
    )
    valid_until = serializers.DateField(required=False, allow_null=True)


class PublicQuotationSerializer(serializers.ModelSerializer):
    items = QuotationItemSerializer(many=True, read_only=True)
    customer_name = serializers.CharField(
        source='customer.business_name', read_only=True
    )

    class Meta:
        model = Quotation
        fields = [
            'number', 'status', 'subtotal', 'iva', 'total',
            'customer_message', 'valid_until', 'items', 'customer_name',
            'created_at',
        ]
