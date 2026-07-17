import httpx
from django.conf import settings


class SatGoError(Exception):
    def __init__(self, message, status_code=None, body=None):
        super().__init__(message)
        self.status_code = status_code
        self.body = body


class SatGoClient:
    def __init__(self):
        self.base_url = (settings.SAT_GO_BASE_URL or '').rstrip('/')
        self.api_key = settings.SAT_GO_API_KEY or ''
        self._token = None

    def get_token(self) -> str:
        if self._token:
            return self._token
        if not self.base_url or not self.api_key:
            raise SatGoError('SAT_GO_BASE_URL and SAT_GO_API_KEY must be set')

        url = f'{self.base_url}/api/Auth/token-json'
        r = httpx.post(url, json={'key': self.api_key}, timeout=60)
        if r.status_code >= 400:
            raise SatGoError(
                f'token failed: {r.status_code}',
                status_code=r.status_code,
                body=r.text,
            )
        data = r.json()
        token = (
            (data.get('tokens') or {}).get('access') or {}
        ).get('value') or data.get('token') or data.get('access_token')
        if not token:
            raise SatGoError('token response missing access token', body=data)
        self._token = token
        return token

    def consultar_facturas_fiel(
        self,
        credential,
        *,
        tipo: str,
        date_from,
        date_to,
        descarga_comprobantes: bool = True,
    ) -> dict:
        """
        tipo: 'emitidas' | 'recibidas'
        date_from / date_to: date or str YYYY-MM-DD
        """
        token = self.get_token()
        url = f'{self.base_url}/api/v2/Consultar/facfiel'
        params = {
            'api-version': '2',
            'tipo': tipo,
            'tipoBusqueda': 0,
            'fecha_inicial': str(date_from),
            'fecha_final': str(date_to),
            'descargaComprobantes': str(descarga_comprobantes).lower(),
        }
        cer = bytes(credential.cer_data)
        key = bytes(credential.key_data)
        files = {
            'Certificado': ('cert.cer', cer, 'application/octet-stream'),
            'llavePrivada': ('key.key', key, 'application/octet-stream'),
        }
        data = {'Contrasena': credential.get_password()}
        headers = {'Authorization': f'Bearer {token}'}

        r = httpx.post(
            url,
            params=params,
            headers=headers,
            files=files,
            data=data,
            timeout=300,
        )
        if r.status_code >= 400:
            raise SatGoError(
                f'facfiel failed: {r.status_code}',
                status_code=r.status_code,
                body=r.text,
            )
        return r.json()
