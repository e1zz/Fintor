from django.urls import path

from . import views

urlpatterns = [
    path('', views.quotation_list_create_view, name='quotation-list-create'),
    path('<int:id>/', views.quotation_detail_view, name='quotation-detail'),
    path('<int:id>/send/', views.quotation_send_view, name='quotation-send'),
    path('<int:id>/convert-to-sale/', views.quotation_convert_to_sale_view, name='quotation-convert-to-sale'),
    path('<int:id>/invoice/', views.quotation_invoice_view, name='quotation-invoice'),
    path('<int:id>/cancel/', views.quotation_cancel_view, name='quotation-cancel'),
]
