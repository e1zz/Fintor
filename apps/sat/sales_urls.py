from django.urls import path

from . import views

urlpatterns = [
    path('', views.sales_list_view, name='sales-list'),
    path('export/', views.sales_export_view, name='sales-export'),
]
