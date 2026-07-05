from django.urls import path

from . import views

urlpatterns = [
    path('', views.customer_list_create_view, name='customer-list-create'),
    path('search/', views.customer_search_view, name='customer-search'),
    path('from-cfdis/', views.customer_from_cfdis_view, name='customer-from-cfdis'),
    path('export/', views.customer_export_view, name='customer-export'),
    path('<int:id>/', views.customer_detail_view, name='customer-detail'),
]
