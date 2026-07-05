from rest_framework import serializers
from .models import ChatConversation, ChatMessage


class ChatMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChatMessage
        fields = '__all__'
        read_only_fields = [f.name for f in ChatMessage._meta.fields]


class ChatConversationSerializer(serializers.ModelSerializer):
    last_message = serializers.SerializerMethodField()

    class Meta:
        model = ChatConversation
        fields = [
            'id', 'title', 'status', 'last_message',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'user', 'created_at', 'updated_at']

    def get_last_message(self, obj):
        message = obj.messages.order_by('-created_at').first()
        if message:
            return ChatMessageSerializer(message).data
        return None


class ChatConversationDetailSerializer(serializers.ModelSerializer):
    messages = ChatMessageSerializer(many=True, read_only=True)

    class Meta:
        model = ChatConversation
        fields = '__all__'
        read_only_fields = ['id', 'user', 'created_at', 'updated_at']


class ChatSendSerializer(serializers.Serializer):
    conversation_id = serializers.IntegerField(required=False, allow_null=True)
    message = serializers.CharField()
