from django.http import HttpResponse
from django.test import RequestFactory, TestCase

from apps.accounts.models import User
from apps.common.middleware import EnsureTenantContext, get_current_tenant_id
from apps.tenants.models import Tenant, UserTenant


class EnsureTenantContextTests(TestCase):
    def setUp(self):
        self.factory = RequestFactory()

    def test_superuser_without_tenant_bypasses_tenant_context(self):
        Tenant.objects.create(name='Acme', company_name='Acme', rfc='XAXX010101000')
        user = User.objects.create_superuser(
            email='admin@example.com',
            password='secret123',
            first_name='Admin',
            last_name='User',
        )

        middleware = EnsureTenantContext(lambda request: HttpResponse('ok'))
        request = self.factory.get('/')
        request.user = user

        response = middleware(request)

        user.refresh_from_db()
        self.assertEqual(response.status_code, 200)
        self.assertIsNone(user.tenant_id)
        self.assertIsNone(get_current_tenant_id())

    def test_user_without_primary_tenant_uses_membership_tenant(self):
        tenant = Tenant.objects.create(name='Beta', company_name='Beta', rfc='XEXX010101000')
        user = User.objects.create_user(
            email='member@example.com',
            password='secret123',
            first_name='Member',
            last_name='User',
        )
        UserTenant.objects.create(user=user, tenant=tenant)

        middleware = EnsureTenantContext(lambda request: HttpResponse('ok'))
        request = self.factory.get('/')
        request.user = user

        response = middleware(request)

        user.refresh_from_db()
        self.assertEqual(response.status_code, 200)
        self.assertEqual(user.tenant_id, tenant.id)

    def test_user_without_any_tenant_is_forbidden(self):
        user = User.objects.create_user(
            email='orphan@example.com',
            password='secret123',
            first_name='Orphan',
            last_name='User',
        )

        middleware = EnsureTenantContext(lambda request: HttpResponse('ok'))
        request = self.factory.get('/')
        request.user = user

        response = middleware(request)

        self.assertEqual(response.status_code, 403)
