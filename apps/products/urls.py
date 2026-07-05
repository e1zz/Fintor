from django.urls import path

from . import views

urlpatterns = [
    path('search/', views.product_search_view, name='product-search'),
    path('', views.product_create_view, name='product-create'),
    path('<int:id>/', views.product_update_view, name='product-update'),
]
