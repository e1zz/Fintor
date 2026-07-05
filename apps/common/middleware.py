import contextvars

_current_tenant_id = contextvars.ContextVar('current_tenant_id', default=None)


def get_current_tenant_id():
    return _current_tenant_id.get()


def set_current_tenant_id(tenant_id):
    return _current_tenant_id.set(tenant_id)


class EnsureTenantContext:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        if request.user.is_authenticated and hasattr(request.user, 'tenant_id'):
            if request.user.tenant_id:
                set_current_tenant_id(request.user.tenant_id)
            else:
                from django.http import HttpResponseForbidden
                return HttpResponseForbidden('No tenant context')

        response = self.get_response(request)
        set_current_tenant_id(None)
        return response
