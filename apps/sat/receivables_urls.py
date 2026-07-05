from django.urls import path

from . import views

urlpatterns = [
    path('', views.receivables_list_view, name='receivables-list'),
    path('<int:cfdi_id>/send-reminder/', views.receivables_send_reminder_view, name='receivables-send-reminder'),
]
