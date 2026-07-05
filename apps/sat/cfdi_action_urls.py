from django.urls import path

from . import views

urlpatterns = [
    path('<int:id>/cancel/', views.cfdi_cancel_view, name='cfdi-cancel'),
    path('<int:id>/resend-email/', views.cfdi_resend_email_view, name='cfdi-resend-email'),
    path('<int:id>/xml/', views.cfdi_xml_view, name='cfdi-xml'),
    path('<int:id>/pdf/', views.cfdi_pdf_view, name='cfdi-pdf'),
]
