from rest_framework import serializers
from .models import SatCredential, SatCfdi


class SatCredentialSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = SatCredential
        fields = [
            'id', 'rfc', 'cer_path', 'key_path', 'password',
            'valid_until', 'is_active',
        ]
        read_only_fields = ['id', 'valid_until']

    def validate_rfc(self, value):
        if len(value) != 13:
            raise serializers.ValidationError('RFC must be 13 characters')
        return value


class SatCfdiSerializer(serializers.ModelSerializer):
    class Meta:
        model = SatCfdi
        fields = '__all__'
        read_only_fields = [f.name for f in SatCfdi._meta.fields]


class SatCfdiUpdateCategorySerializer(serializers.Serializer):
    category_id = serializers.IntegerField()
