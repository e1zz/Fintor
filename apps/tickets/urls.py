from django.urls import path

from . import views

urlpatterns = [
    path('upload/', views.ticket_upload_view, name='ticket-upload'),
    path('', views.ticket_list_view, name='ticket-list'),
    path('pending-review/', views.ticket_pending_review_view, name='ticket-pending-review'),
    path('pending-review/count/', views.ticket_pending_count_view, name='ticket-pending-count'),
    path('<int:id>/', views.ticket_detail_view, name='ticket-detail'),
    path('<int:id>/confirm/', views.ticket_confirm_view, name='ticket-confirm'),
    path('<int:id>/link-cfdi/<int:cfdi_id>/', views.ticket_link_cfdi_view, name='ticket-link-cfdi'),
    path('<int:id>/accept-link/<int:cfdi_id>/', views.ticket_accept_link_view, name='ticket-accept-link'),
]
