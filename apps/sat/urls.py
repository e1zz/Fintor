from django.urls import path

from . import views

urlpatterns = [
    path('credentials/', views.credential_list_create_view, name='sat-credentials'),
    path('cfdis/', views.cfdi_list_view, name='sat-cfdis'),
    path('cfdis/<int:id>/category/', views.cfdi_update_category_view, name='sat-cfdi-update-category'),
]
