from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Notification
from .serializers import NotificationSerializer


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def notification_list_view(request):
    notifications = Notification.objects.filter(
        tenant=request.user.tenant,
    ).order_by('-created_at')
    serializer = NotificationSerializer(notifications, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def notification_unread_count_view(request):
    count = Notification.objects.filter(
        tenant=request.user.tenant,
        read_at__isnull=True,
    ).count()
    return Response({'count': count})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def notification_mark_read_view(request, id):
    from .models import Notification
    notification = Notification.objects.get(id=id, tenant=request.user.tenant)
    from django.utils import timezone
    notification.read_at = timezone.now()
    notification.save(update_fields=['read_at'])
    return Response(NotificationSerializer(notification).data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def notification_mark_all_read_view(request):
    from django.utils import timezone
    Notification.objects.filter(
        tenant=request.user.tenant,
        read_at__isnull=True,
    ).update(read_at=timezone.now())
    return Response({'status': 'ok'})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def notification_mark_all_safe_view(request):
    Notification.objects.filter(
        tenant=request.user.tenant,
        read_at__isnull=True,
    ).update(unsafe=False)
    return Response({'status': 'ok'})
