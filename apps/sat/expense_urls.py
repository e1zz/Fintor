from django.urls import path

from . import views

urlpatterns = [
    path('', views.expense_list_view, name='expense-list'),
    path('export/', views.expense_export_view, name='expense-export'),
]
