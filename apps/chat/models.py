from django.db import models

from apps.common.models import TenantMixin


class ChatConversation(TenantMixin):
    class Status(models.TextChoices):
        ACTIVE = 'active', 'Active'
        ARCHIVED = 'archived', 'Archived'

    tenant = models.ForeignKey('tenants.Tenant', on_delete=models.CASCADE)
    user = models.ForeignKey(
        'accounts.User',
        on_delete=models.CASCADE,
        related_name='chat_conversations',
    )
    title = models.CharField(max_length=255, null=True, blank=True)
    status = models.CharField(
        max_length=20, choices=Status.choices, default=Status.ACTIVE
    )
    metadata = models.JSONField(null=True, blank=True)
    deleted_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'chat_conversations'

    @staticmethod
    def title_from_first_message(first_message):
        return first_message[:60].strip()


class ChatMessage(models.Model):
    class Role(models.TextChoices):
        USER = 'user', 'User'
        ASSISTANT = 'assistant', 'Assistant'
        SYSTEM = 'system', 'System'
        TOOL = 'tool', 'Tool'

    conversation = models.ForeignKey(
        ChatConversation, on_delete=models.CASCADE, related_name='messages'
    )
    role = models.CharField(max_length=20, choices=Role.choices)
    content = models.TextField()
    tool_calls = models.JSONField(null=True, blank=True)
    tool_results = models.JSONField(null=True, blank=True)
    tokens_input = models.PositiveIntegerField(null=True, blank=True)
    tokens_output = models.PositiveIntegerField(null=True, blank=True)
    was_hallucinated = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'chat_messages'
        ordering = ['created_at']
