import httpx
from django.conf import settings


class GeminiService:

    def classify(self, cfdi):
        return None

    def parse_ticket_image(self, image_path, tenant):
        return None

    def _call_api(self, prompt):
        api_key = settings.GEMINI_API_KEY
        if not api_key or api_key == 'your-gemini-api-key':
            return None

        url = (
            f'https://generativelanguage.googleapis.com/v1beta/models/'
            f'{settings.GEMINI_MODEL}:generateContent?key={api_key}'
        )
        try:
            response = httpx.post(url, json={'contents': [{'parts': [{'text': prompt}]}]}, timeout=30)
            response.raise_for_status()
            return response.json()
        except Exception:
            return None
