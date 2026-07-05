from django.urls import path

from . import views

urlpatterns = [
    path('top-vendors/', views.top_vendors_view, name='onboarding-top-vendors'),
    path('mark-cost-of-sales-vendors/', views.mark_cost_of_sales_vendors_view, name='onboarding-mark-cost-of-sales'),
    path('business-info/', views.business_info_view, name='onboarding-business-info'),
    path('sat-connect/', views.sat_connect_view, name='onboarding-sat-connect'),
    path('sat-status/', views.sat_status_view, name='onboarding-sat-status'),
    path('complete/', views.complete_onboarding_view, name='onboarding-complete'),
]
