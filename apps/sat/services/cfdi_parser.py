import base64
from datetime import datetime
from decimal import Decimal, InvalidOperation
from uuid import UUID

from apps.sat.models import SatCfdi


def _parse_date(value):
    if not value:
        return None
    s = str(value).strip()
    for fmt in (
        '%Y-%m-%dT%H:%M:%S',
        '%Y-%m-%d %H:%M:%S',
        '%Y-%m-%dT%H:%M:%S.%f',
        '%Y-%m-%d',
        '%d/%m/%Y %H:%M:%S',
        '%d/%m/%Y',
    ):
        try:
            return datetime.strptime(s[:26], fmt)
        except ValueError:
            continue
    try:
        return datetime.fromisoformat(s.replace('Z', '+00:00')).replace(tzinfo=None)
    except ValueError:
        return None


def _parse_decimal(value):
    if value is None or value == '':
        return Decimal('0')
    try:
        return Decimal(str(value).replace(',', ''))
    except (InvalidOperation, ValueError):
        return Decimal('0')


def _decode_content(value):
    if not value:
        return None
    if isinstance(value, bytes):
        return value.decode('utf-8', errors='replace')
    s = str(value).strip()
    if s.startswith('<'):
        return s
    try:
        return base64.b64decode(s).decode('utf-8', errors='replace')
    except Exception:
        return s


def _document_type(tipo: str) -> str:
    if tipo in ('emitidas', 'issued'):
        return SatCfdi.DocumentType.ISSUED
    return SatCfdi.DocumentType.RECEIVED


def _efecto(value):
    if not value:
        return None
    s = str(value).strip().lower()
    if s.startswith('i') or s == 'ingreso':
        return 'I'
    if s.startswith('e') or s == 'egreso':
        return 'E'
    if s.startswith('t') or s == 'traslado':
        return 'T'
    if s.startswith('n') or s == 'nomina' or s == 'nómina':
        return 'N'
    if s.startswith('p') or s == 'pago':
        return 'P'
    return s[:1].upper() or None


def save_comprobante(comprobante: dict, *, tenant, download_request, tipo: str):
    raw_uuid = comprobante.get('uuid') or comprobante.get('UUID')
    if not raw_uuid:
        return None
    try:
        uuid = UUID(str(raw_uuid))
    except ValueError:
        return None

    xml = _decode_content(comprobante.get('content') or comprobante.get('xml'))
    defaults = {
        'tenant': tenant,
        'sat_download_request': download_request,
        'document_type': _document_type(tipo),
        'sender_rfc': (
            comprobante.get('rfc_emisor')
            or comprobante.get('rfCemisor')
            or comprobante.get('rfcEmisor')
            or ''
        )[:13],
        'sender_name': (
            comprobante.get('razon_social_emisor')
            or comprobante.get('razonSocialEmisor')
            or ''
        )[:255],
        'receiver_rfc': (
            comprobante.get('rfc_receptor') or comprobante.get('rfcReceptor') or ''
        )[:13],
        'receiver_name': (
            comprobante.get('razon_social_receptor')
            or comprobante.get('razonSocialReceptor')
            or ''
        )[:255],
        'issue_date': _parse_date(
            comprobante.get('fecha_emision')
            or comprobante.get('fechaEmision')
            or comprobante.get('fechaCertificacion')
        ),
        'total': _parse_decimal(comprobante.get('total')),
        'document_subtype': _efecto(
            comprobante.get('efecto_comprobante')
            or comprobante.get('efectoDelComprobante')
        ),
        'status': (
            comprobante.get('estatus')
            or comprobante.get('estadoDeComprobante')
            or comprobante.get('estatusCancelacion')
            or ''
        )[:20]
        or None,
        'xml_content': xml,
    }

    cfdi, _created = SatCfdi.objects.update_or_create(
        uuid=uuid,
        defaults=defaults,
    )
    return cfdi


def save_comprobantes(result: dict, *, tenant, download_request, tipo: str) -> int:
    items = result.get('comprobantes') or []
    count = 0
    for item in items:
        if save_comprobante(item, tenant=tenant, download_request=download_request, tipo=tipo):
            count += 1
    return count
