from rest_framework import serializers
from .models import TicketImage, TicketExpense


class TicketImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = TicketImage
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'uploaded_by']


class TicketExpenseSerializer(serializers.ModelSerializer):
    class Meta:
        model = TicketExpense
        fields = '__all__'
        read_only_fields = [
            'id', 'tenant', 'confidence', 'review_status',
            'has_invoice', 'linked_cfdi', 'created_at', 'updated_at',
        ]


class TicketExpenseUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = TicketExpense
        fields = [
            'sender_rfc', 'sender_name', 'ticket_date', 'subtotal',
            'iva', 'total', 'description', 'bucket', 'expense_category', 'notes',
        ]


class TicketConfirmSerializer(serializers.Serializer):
    bucket = serializers.ChoiceField(choices=TicketExpense.Bucket.choices)
    expense_category_id = serializers.IntegerField(required=False, allow_null=True)
    notes = serializers.CharField(required=False, allow_blank=True)
