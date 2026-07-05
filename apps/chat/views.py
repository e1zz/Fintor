from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

from .models import ChatMessage
from .serializers import ChatMessageSerializer


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def chat_messages_view(request):
    messages = ChatMessage.objects.filter(
        tenant=request.user.tenant,
    ).select_related('user').order_by('created_at')
    serializer = ChatMessageSerializer(messages, many=True)
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def chat_send_view(request):
    serializer = ChatMessageSerializer(data={
        'content': request.data.get('content'),
    })
    serializer.is_valid(raise_exception=True)
    serializer.save(
        tenant=request.user.tenant,
        user=request.user,
    )
    return Response(serializer.data, status=status.HTTP_201_CREATED)
