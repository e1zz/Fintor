from rest_framework import serializers
from .models import ExpenseCategory


class ExpenseCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = ExpenseCategory
        fields = ['id', 'name', 'slug', 'group', 'nature', 'icon', 'color']
        read_only_fields = fields
