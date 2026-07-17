from rest_framework import serializers
from .models import SatCredential, SatCfdi, SatDownloadRequest


class SatCredentialSerializer(serializers.ModelSerializer):
    class Meta:
        model = SatCredential
        fields = [
            'id', 'rfc',
            'valid_until', 'is_active',
        ]
        read_only_fields = fields


class SatCredentialUploadSerializer(serializers.Serializer):
    cer = serializers.FileField()
    key = serializers.FileField()
    password = serializers.CharField(write_only=True)

    def validate_cer(self, f):
        name = (f.name or '').lower()
        if not name.endswith('.cer'):
            raise serializers.ValidationError('File must be a .cer certificate')
        return f

    def validate_key(self, f):
        name = (f.name or '').lower()
        if not name.endswith('.key'):
            raise serializers.ValidationError('File must be a .key private key')
        return f


class SatCfdiSerializer(serializers.ModelSerializer):
    class Meta:
        model = SatCfdi
        fields = '__all__'
        read_only_fields = [f.name for f in SatCfdi._meta.fields]


class SatCfdiUpdateCategorySerializer(serializers.Serializer):
    category_id = serializers.IntegerField()


class SatDownloadRequestSerializer(serializers.ModelSerializer):
    class Meta:
        model = SatDownloadRequest
        fields = [
            'id', 'sat_credential', 'request_id', 'download_type', 'status',
            'date_from', 'date_to', 'packages_count', 'cfdis_count',
            'error_message', 'created_at', 'updated_at',
        ]
        read_only_fields = fields


class SatDownloadCreateSerializer(serializers.Serializer):
    credential_id = serializers.IntegerField()
    download_type = serializers.ChoiceField(
        choices=SatDownloadRequest.DownloadType.choices
    )
    date_from = serializers.DateField()
    date_to = serializers.DateField()

    def validate(self, data):
        if data['date_from'] > data['date_to']:
            raise serializers.ValidationError('date_from must be <= date_to')
        return data
