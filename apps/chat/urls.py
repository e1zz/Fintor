from django.urls import path

from . import views

urlpatterns = [
    path('messages/', views.chat_messages_view, name='chat-messages'),
    path('send/', views.chat_send_view, name='chat-send'),
]
