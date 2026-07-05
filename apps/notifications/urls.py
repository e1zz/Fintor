from django.urls import path

from . import views

urlpatterns = [
    path('', views.notification_list_view, name='notification-list'),
    path('unread-count/', views.notification_unread_count_view, name='notification-unread-count'),
    path('<int:id>/mark-read/', views.notification_mark_read_view, name='notification-mark-read'),
    path('mark-all-read/', views.notification_mark_all_read_view, name='notification-mark-all-read'),
    path('mark-all-safe/', views.notification_mark_all_safe_view, name='notification-mark-all-safe'),
]
