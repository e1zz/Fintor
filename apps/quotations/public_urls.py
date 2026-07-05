from django.urls import path

from . import views

urlpatterns = [
    path('<str:token>/', views.public_quotation_view, name='public-quotation'),
    path('<str:token>/accept/', views.public_quotation_accept_view, name='public-quotation-accept'),
    path('<str:token>/pdf/', views.public_quotation_pdf_view, name='public-quotation-pdf'),
]
