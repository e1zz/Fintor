from rest_framework.permissions import BasePermission

class IsTenantMember(BasePermission):
    """
    Custom permission to check if the user is a member of the tenant.
    """

    def has_object_permission(self, request, view, obj):
        return hasattr(obj, 'tenant') and obj.tenant_id == request.user.tenant_id

class IsOnboardingComplete(BasePermission):
    """
    Custom permission to check if the user's onboarding is complete.
    """
    
    def has_permission(self, request, view):
        return request.user.tenant.onboarding_completed