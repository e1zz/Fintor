from django.urls import path

from . import views

urlpatterns = [
    path('summary/', views.dashboard_summary_view, name='dashboard-summary'),
    path('recent-invoices/', views.dashboard_recent_invoices_view, name='dashboard-recent-invoices'),
    path('expiring-cfdis/', views.dashboard_expiring_cfdis_view, name='dashboard-expiring-cfdis'),
    path('pending-documents/', views.dashboard_pending_documents_view, name='dashboard-pending-documents'),
    path('chart-data/', views.dashboard_chart_data_view, name='dashboard-chart-data'),
]
