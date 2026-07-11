# SAT-Go Python Client — Audit

## What It Is

A Flask proxy that wraps the SAT-Go API (Mexican tax authority). It takes simple form inputs from a web UI, calls the real SAT-Go endpoints via `requests`, and returns the results as JSON.

## Architecture

```
Flask app  →  SAT-Go API  →  SAT servers
 (proxy)       (external)
```

## Modulesi just added an AUDIT.md file, this is what we are going to do, we are going to use that python structure to create our own api to fetch data from SAT, first i want youi just added an AUDIT.md file, this is what we are going to do, we are going to use that python structure to create our own api to fetch data from SAT, first i want you

| Module | Endpoint | Returns |
|--------|----------|---------|
| auth | `POST /api/auth/crear-key` | API Key from portal token |
| auth | `POST /api/auth/generar-token` | JWT from API Key |
| facturas | `POST /api/facturas/consultar` | Invoice list (JSON) |
| oc | `POST /api/oc/descargar` | Opinión de Cumplimiento (PDF) |
| csf | `POST /api/csf/descargar` | Constancia Situación Fiscal (PDF) |
| dec | `POST /api/dec/descargar` | Declaraciones (ZIP) |
| info_fiscal | `POST /api/info-fiscal/consultar` | Fiscal info (JSON) |

Each module supports two auth methods:
- **FIEL**: multipart POST with `.key` + `.cer` files
- **CIEC**: GET request with `Secret` header

## Files

```
config/api.py              — SAT-Go base URLs + endpoint paths
services/auth_service.py   — CreateKey + token generation
services/factura_service.py — Invoice queries (FIEL + CIEC)
services/oc_service.py     — OC PDF download (FIEL + CIEC)
services/csf_service.py    — CSF PDF download (FIEL + CIEC)
services/dec_service.py    — Declaraciones ZIP download (FIEL + CIEC)
services/info_fiscal_service.py — Fiscal info queries (FIEL + CIEC)
routes/auth.py             — Flask blueprint: /api/auth/*
routes/facturas.py         — Flask blueprint: /api/facturas/*
routes/oc.py               — Flask blueprint: /api/oc/*
routes/csf.py              — Flask blueprint: /api/csf/*
routes/dec.py              — Flask blueprint: /api/dec/*
routes/info_fiscal.py      — Flask blueprint: /api/info-fiscal/*
app.py                     — Flask entry point
```

## Key Observations

1. **Empty base URLs** — `config/api.py` has `BASE_URL = ''` and `BASE_URL_V1 = ''`. Must be set before anything works.
2. **SSL disabled everywhere** — All services use `verify=False`. Needs proper certs in production.
3. **FIEL requires file uploads** — `.key` and `.cer` files sent as multipart. React Native needs file picking + `FormData` upload.
4. **PDF/ZIP as base64** — File downloads come back as `{"pdf_base64": "...", "file_name": "...", "content_type": "..."}` in JSON.
5. **All routes are POST** — Even CIEC queries that are logically GET on the SAT-Go side.
6. **RequestId pattern** — Some endpoints return a `RequestId` header/body for session continuation across calls.
7. **403 limit handling** — `dec_service` catches rate limit errors (403 with `featureCode`/`dailyLimit`).
8. **`requests` only** — No async, no connection pooling, no retry logic.

## Django Port

### Backend (Django)

The services layer is pure HTTP calls. Port steps:

1. Copy `config/api.py` → Django `settings.py` or a `config.py`
2. Convert the 6 service functions → Django views (or a single `sat_client.py` service module)
3. Replace Flask `request.form` / `request.files` with Django's equivalent
4. The Flask blueprints map 1:1 to Django URL patterns

### Frontend (React Native)

Call the Django endpoints. The existing `static/js/app.js` shows what the mobile app needs to do:

- Store RFC, token, CIEC in AsyncStorage (replaces localStorage)
- File pickers for .key/.cer (replaces `<input type="file">`)
- `FormData` for multipart uploads
- Decode base64 responses to open PDFs/ZIPs
- Handle `request_id` for session continuation

### Minimal Django Files

```
config.py          — SAT-Go URLs
views.py           — 6 views (auth, facturas, oc, csf, dec, info_fiscal)
urls.py            — URL patterns
sat_client.py      — HTTP calls to SAT-Go (the services/ logic)
```

The services are ~100-130 lines each. Most of it is duplicated boilerplate (FIEL vs CIEC variants). Can be collapsed to a single shared request function.
