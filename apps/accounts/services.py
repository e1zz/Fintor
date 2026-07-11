from django.db import transaction
from django.contrib.auth import authenticate
from rest_framework_simplejwt.tokens import RefreshToken

from apps.tenants.models import Tenant, UserTenant
from apps.accounts.models import User
from apps.tenants.serializers import TenantSerializer
from apps.accounts.serializers import UserSerializer


def get_tokens_for_user(user):
    refresh = RefreshToken.for_user(user)
    return {
        'access': str(refresh.access_token),
        'refresh': str(refresh),
    }


class AuthService:

    @transaction.atomic
    def register(self, data):
        tenant = Tenant.objects.create(
            name=data['company_name'],
            company_name=data['company_name'],
            rfc=data['rfc'],
        )
        user = User.objects.create_user(
            email=data['email'],
            password=data['password'],
            first_name=data['first_name'],
            last_name=data['last_name'],
            tenant=tenant,
        )
        UserTenant.objects.create(user=user, tenant=tenant)

        tokens = get_tokens_for_user(user)
        return {
            'token': tokens['access'],
            'refresh': tokens['refresh'],
            'user': UserSerializer(user).data,
            'tenant': TenantSerializer(tenant).data,
        }

    def login(self, data):
        user = authenticate(
            email=data['email'],
            password=data['password'],
        )
        if not user:
            raise ValueError('Invalid credentials')

        tokens = get_tokens_for_user(user)
        return {
            'token': tokens['access'],
            'refresh': tokens['refresh'],
            'user': UserSerializer(user).data,
            'tenant': TenantSerializer(user.tenant).data if user.tenant else None,
        }

    # ponytail: unsecured reset (email + new password only); add token/email when shipping
    def reset_password(self, data):
        try:
            user = User.objects.get(email=data['email'])
        except User.DoesNotExist:
            raise ValueError('User not found')
        user.set_password(data['password'])
        user.save(update_fields=['password'])
        return {'detail': 'Password updated'}
