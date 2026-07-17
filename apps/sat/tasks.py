from celery import shared_task

from apps.sat.models import SatCredential, SatDownloadRequest
from apps.sat.services.cfdi_parser import save_comprobantes
from apps.sat.services.sat_go_client import SatGoClient, SatGoError


def _tipo_for_download(download_type: str) -> str:
    if download_type == SatDownloadRequest.DownloadType.ISSUED:
        return 'emitidas'
    return 'recibidas'


@shared_task(bind=True, max_retries=2, soft_time_limit=600)
def sat_download_task(self, download_request_id: int):
    try:
        req = SatDownloadRequest.objects.select_related('sat_credential', 'tenant').get(
            id=download_request_id
        )
    except SatDownloadRequest.DoesNotExist:
        return {'error': 'download request not found'}

    credential = req.sat_credential
    tipo = _tipo_for_download(req.download_type)

    req.status = SatDownloadRequest.Status.QUERYING
    req.error_message = None
    req.save(update_fields=['status', 'error_message', 'updated_at'])

    try:
        client = SatGoClient()
        result = client.consultar_facturas_fiel(
            credential,
            tipo=tipo,
            date_from=req.date_from,
            date_to=req.date_to,
            descarga_comprobantes=True,
        )
        if result.get('success') is False:
            raise SatGoError(result.get('errorMessage') or 'SAT-Go returned success=false', body=result)

        if result.get('requestId'):
            req.request_id = str(result['requestId'])[:255]

        count = save_comprobantes(
            result,
            tenant=req.tenant,
            download_request=req,
            tipo=tipo,
        )
        req.cfdis_count = count
        req.status = SatDownloadRequest.Status.FINISHED
        req.save(update_fields=['request_id', 'cfdis_count', 'status', 'updated_at'])
        return {'ok': True, 'cfdis_count': count, 'request_id': req.id}
    except SatGoError as e:
        req.status = SatDownloadRequest.Status.ERROR
        req.error_message = str(e)[:2000]
        if e.body and not req.error_message:
            req.error_message = str(e.body)[:2000]
        req.save(update_fields=['status', 'error_message', 'updated_at'])
        return {'error': str(e)}
    except Exception as e:
        req.status = SatDownloadRequest.Status.ERROR
        req.error_message = str(e)[:2000]
        req.save(update_fields=['status', 'error_message', 'updated_at'])
        raise
