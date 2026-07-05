from django.urls import path

from . import views

urlpatterns = [
    path('', views.vendor_list_view, name='vendor-list'),
    path('export/', views.vendor_export_view, name='vendor-export'),
    path('<int:id>/toggle-cost-of-sales/', views.vendor_toggle_cost_of_sales_view, name='vendor-toggle-cost-of-sales'),
]
