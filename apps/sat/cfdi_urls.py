from django.urls import path

from . import views

urlpatterns = [
    path('pending-review/', views.cfdi_pending_review_view, name='cfdi-pending-review'),
    path('pending-review/count/', views.cfdi_pending_review_count_view, name='cfdi-pending-review-count'),
    path('<int:id>/confirm-category/', views.cfdi_confirm_category_view, name='cfdi-confirm-category'),
]
