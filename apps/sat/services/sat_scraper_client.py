import base64
import time

import httpx
from django.conf import settings


class SatScraperError(Exception):
    def __init__(self, message, status_code=None, body=None):
        super().__init__(message)
        self.status_code = status_code
        self.body = body


class SatScraperClient:
    def __init__(self):
        self.base_url = (settings.SAT_SCRAPER_BASE_URL or '').rstrip('/')
        self.token = settings.SAT_SCRAPER_TOKEN or ''

    def _headers(self):
        return {
            'Authorization': f'Bearer {self.token}',
            'Content-Type': 'application/json',
        }

    def _request(self, method, path, **kwargs):
        if not self.base_url or not self.token:
            raise SatScraperError('SAT_SCRAPER_BASE_URL and SAT_SCRAPER_TOKEN must be set')
        timeout = kwargs.pop('timeout', 60)
        r = httpx.request(
            method,
            f'{self.base_url}{path}',
            headers=self._headers(),
            timeout=timeout,
            **kwargs,
        )
        if r.status_code >= 400:
            detail = r.text
            try:
                j = r.json()
                detail = j.get('message') or j.get('error') or detail
            except Exception:
                pass
            raise SatScraperError(
                f'{method} {path} failed: {r.status_code} — {str(detail)[:500]}',
                status_code=r.status_code,
                body=r.text,
            )
        if not r.content:
            return None
        return r.json()

    def create_session(self, credential) -> str:
        data = self._request(
            'POST',
            '/api/v1/auth/session',
            json={
                'auth_type': 'fiel',
                'rfc': credential.rfc,
                'certificate_b64': base64.b64encode(bytes(credential.cer_data)).decode(),
                'private_key_b64': base64.b64encode(bytes(credential.key_data)).decode(),
                'passphrase': credential.get_password(),
            },
            timeout=120,
        )
        sid = (data or {}).get('session_id')
        if not sid:
            raise SatScraperError('session response missing session_id', body=data)
        return sid

    def queue_efacturas(self, session_id, *, tipo, date_from, date_to, download_xml=True) -> str:
        data = self._request(
            'POST',
            '/api/v1/scraper/efacturas',
            json={
                'session_id': session_id,
                'query_params': {
                    'invoice_type': tipo,
                    'search_by': 'fecha',
                    'start_date': str(date_from),
                    'end_date': str(date_to),
                    'uuid': None,
                    'counterparty_rfc': None,
                    'status': 'todos',
                    'comprobante_filter': None,
                    'download_xml': download_xml,
                    'download_pdf': False,
                    'request_metadata': False,
                },
            },
        )
        jid = (data or {}).get('job_id')
        if not jid:
            raise SatScraperError('efacturas response missing job_id', body=data)
        return jid

    def get_job(self, job_id) -> dict:
        return self._request('GET', f'/api/v1/scraper/jobs/{job_id}') or {}

    def wait_job(self, job_id, *, poll_seconds=5, max_wait=540) -> dict:
        elapsed = 0
        while elapsed < max_wait:
            job = self.get_job(job_id)
            status = job.get('status')
            if status == 'completed':
                return job
            if status == 'failed':
                err = job.get('error') or {}
                msg = err.get('message') if isinstance(err, dict) else str(err or 'job failed')
                raise SatScraperError(msg, body=job)
            time.sleep(poll_seconds)
            elapsed += poll_seconds
        raise SatScraperError(f'job {job_id} timed out after {max_wait}s')

    def consultar_facturas_fiel(
        self,
        credential,
        *,
        tipo: str,
        date_from,
        date_to,
        descarga_comprobantes: bool = True,
    ) -> dict:
        session_id = self.create_session(credential)
        job_id = self.queue_efacturas(
            session_id,
            tipo=tipo,
            date_from=date_from,
            date_to=date_to,
            download_xml=descarga_comprobantes,
        )
        job = self.wait_job(job_id)
        invoices = (job.get('data') or {}).get('invoices') or []
        return {'job_id': job_id, 'session_id': session_id, 'comprobantes': invoices}
