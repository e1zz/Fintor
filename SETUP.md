# Prisma Full Stack Migration Guide

## 1. Overview

Prisma is a financial SaaS for Mexican PyMEs and sole proprietors. It automates CFDI downloads from SAT, classifies expenses with AI, captures receipts via photo, calculates estimated taxes, and issues invoices.

This document provides the complete blueprint for migrating from Laravel + Angular to **Django 5.2 (backend)** + **React Native/Expo (mobile app)**.

**Core features:**
- SAT CFDI download and parsing (SAT-Go API) + timbrado/cancel (Enlace Fiscal PAC)
- 5-layer expense classification pipeline (rules + Gemini AI)
- Ticket capture via Gemini Vision OCR
- Quotation management with PDF generation
- AI chat with 13 tools and hallucination detection
- Multitenancy (single database, tenant_id filtering)
- Dashboard (business, fiscal, personal views)

---

# PART 1: DJANGO BACKEND

## 2. Backend Stack

| Layer | Package | Version | Purpose |
|-------|---------|---------|---------|
| **Framework** | Django | 5.2 | Web framework |
| **Python** | Python | 3.12 | Runtime |
| **Database** | PostgreSQL | 16 | Primary database |
| **API** | djangorestframework | 3.15 | REST API framework |
| **Auth** | djangorestframework-simplejwt | 5.3 | JWT authentication |
| **CORS** | django-cors-headers | 4.4 | Cross-origin support |
| **Queues** | Celery | 5.4 | Background jobs |
| **Cache/Broker** | Redis | 5.x | Celery broker + cache |
| **File Storage** | django-storages | 1.14 | Cloudflare R2 (S3-compatible) |
| **PDF** | WeasyPrint | 62.0 | Quotation and CFDI PDFs |
| **Excel** | openpyxl | 3.1 | Spreadsheet export |
| **QR Codes** | qrcode | 7.4 | Public quotation links |
| **HTTP Client** | httpx | 0.27 | Async HTTP for APIs |
| **XML** | lxml | 5.2 | CFDI XML parsing |
| **Encryption** | cryptography | 42.0 | SAT password encryption |
| **Environment** | python-decouple | 3.8 | Environment variables |
| **Images** | Pillow | 10.3 | Image handling |

---

## 3. Backend Setup

### 3.1 Create Project

```bash
# Create and activate virtual environment
python -m venv venv
source venv/bin/activate  # Linux/Mac
# venv\Scripts\activate   # Windows

# Install Django
pip install django

# Create project
django-admin startproject config .

# Create apps directory
mkdir apps

# Create each app
cd apps
python ../manage.py startapp accounts
python ../manage.py startapp tenants
python ../manage.py startapp sat
python ../manage.py startapp classification
python ../manage.py startapp vendors
python ../manage.py startapp tickets
python ../manage.py startapp customers
python ../manage.py startapp products
python ../manage.py startapp quotations
python ../manage.py startapp chat
python ../manage.py startapp notifications
python ../manage.py startapp dashboard
python ../manage.py startapp common
cd ..

# Install dependencies
pip install djangorestframework djangorestframework-simplejwt django-cors-headers
pip install celery redis django-storages boto3
pip install weasyprint openpyxl qrcode
pip install httpx zeep lxml cryptography
pip install python-decouple Pillow pytest pytest-django

# Save requirements
pip freeze > requirements.txt
```

### 3.2 Database Setup

```bash
# Create PostgreSQL database
createdb prisma_db

# Or via psql
psql -U postgres
CREATE DATABASE prisma_db;
CREATE USER prisma_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE prisma_db TO prisma_user;
```

### 3.3 Run Migrations

```bash
python manage.py makemigrations
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

### 3.4 Start Celery (separate terminal)

```bash
celery -A config worker -l info
```

---

## 4. Backend Project Structure

```
prisma-django/
├── config/                          # Django project settings
│   ├── settings/
│   │   ├── base.py                  # Shared settings
│   │   ├── development.py           # Dev overrides
│   │   └── production.py            # Prod overrides
│   ├── urls.py                      # Root URL configuration
│   ├── wsgi.py
│   ├── asgi.py
│   └── celery.py                    # Celery configuration
├── apps/
│   ├── accounts/                    # User model, auth
│   ├── tenants/                     # Tenant model, onboarding
│   ├── sat/                         # SAT credentials, CFDI download/parse
│   │   └── services/
│   │       ├── sat_go_client.py     # SAT-Go REST: facturas, OC, CSF, dec, info fiscal
│   │       ├── enlace_fiscal_service.py # PAC: timbrado 4.0, cancel, PDF, correo
│   │       ├── cfdi_parser.py       # XML parsing
│   │       └── emission_service.py  # CFDI emission orchestration
│   ├── classification/              # Expense categories, vendor rules
│   ├── vendors/                     # Vendor model
│   ├── tickets/                     # Ticket images + expenses
│   │   └── services/
│   │       ├── parsing_service.py   # Gemini Vision OCR
│   │       └── reconciliation.py    # Ticket-CFDI matching
│   ├── customers/                   # Customer CRUD
│   ├── products/                    # Product catalog
│   ├── quotations/                  # Quotations + items + PDF
│   │   └── services/
│   │       ├── quotation_service.py
│   │       └── pdf_service.py
│   ├── chat/                        # Conversations, messages, SSE
│   │   └── services/
│   │       ├── chat_service.py      # Orchestrator
│   │       ├── tools.py             # 13 tools
│   │       ├── hallucination.py     # 4 detectors
│   │       └── prompt_builder.py    # System prompt
│   ├── notifications/               # Notification model + generators
│   ├── dashboard/                   # Aggregations
│   │   └── services/
│   │       ├── dashboard_service.py
│   │       ├── financial.py
│   │       └── insights.py
│   └── common/                      # Shared: base models, middleware
│       ├── models.py                # TenantMixin, TenantManager
│       ├── middleware.py            # EnsureTenantContext
│       └── permissions.py
├── services/                        # Framework-agnostic services
│   ├── gemini_service.py            # Gemini AI
│   ├── export_service.py            # Excel export
│   └── ai/
│       ├── provider.py              # AIProviderInterface
│       └── gemini.py                # GeminiProvider
├── manage.py
├── requirements.txt
└── .env
```

---

## 5. Backend Settings

### 5.1 config/settings/base.py

```python
from pathlib import Path
from decouple import config
from datetime import timedelta

BASE_DIR = Path(__file__).resolve().parent.parent.parent

SECRET_KEY = config('SECRET_KEY')
DEBUG = config('DEBUG', default=False, cast=bool)
ALLOWED_HOSTS = config('ALLOWED_HOSTS', cast=lambda v: [s.strip() for s in v.split(',')])

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',
    'rest_framework_simplejwt',
    'corsheaders',
    'storages',
    'apps.common',
    'apps.accounts',
    'apps.tenants',
    'apps.sat',
    'apps.classification',
    'apps.vendors',
    'apps.tickets',
    'apps.customers',
    'apps.products',
    'apps.quotations',
    'apps.chat',
    'apps.notifications',
    'apps.dashboard',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'apps.common.middleware.EnsureTenantContext',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'config.urls'
WSGI_APPLICATION = 'config.wsgi.application'

# Database
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': config('DB_NAME', default='prisma_db'),
        'USER': config('DB_USER', default='prisma_user'),
        'PASSWORD': config('DB_PASSWORD', default=''),
        'HOST': config('DB_HOST', default='localhost'),
        'PORT': config('DB_PORT', default='5432'),
    }
}

# Custom User model
AUTH_USER_MODEL = 'accounts.User'

# Internationalization
LANGUAGE_CODE = 'es-mx'
TIME_ZONE = 'America/Mexico_City'
USE_I18N = True
USE_TZ = True

# Static/Media
STATIC_URL = 'static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
MEDIA_URL = 'media/'
MEDIA_ROOT = BASE_DIR / 'media'

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# REST Framework
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated',
    ),
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20,
}

# Simple JWT
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(hours=1),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'AUTH_HEADER_TYPES': ('Bearer',),
}

# CORS
CORS_ALLOWED_ORIGINS = config('CORS_ALLOWED_ORIGINS', cast=lambda v: [s.strip() for s in v.split(',')])
CORS_ALLOW_CREDENTIALS = True

# Celery
CELERY_BROKER_URL = config('CELERY_BROKER_URL', default='redis://localhost:6379/0')
CELERY_RESULT_BACKEND = config('CELERY_RESULT_BACKEND', default='redis://localhost:6379/0')
CELERY_ACCEPT_CONTENT = ['json']
CELERY_TASK_SERIALIZER = 'json'
CELERY_TIMEZONE = 'America/Mexico_City'

# Cache
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.redis.RedisCache',
        'LOCATION': config('REDIS_URL', default='redis://localhost:6379/1'),
    }
}

# File storage (Cloudflare R2)
STORAGES = {
    'default': {
        'BACKEND': 'storages.backends.s3boto3.S3Boto3Storage',
        'OPTIONS': {
            'access_key': config('R2_ACCESS_KEY_ID'),
            'secret_key': config('R2_SECRET_ACCESS_KEY'),
            'bucket_name': config('R2_BUCKET_NAME'),
            'endpoint_url': config('R2_ENDPOINT_URL'),
            'region_name': 'auto',
            'default_acl': 'private',
        },
    },
    'staticfiles': {
        'BACKEND': 'django.contrib.staticfiles.storage.StaticFilesStorage',
    },
}

# Gemini AI
GEMINI_API_KEY = config('GEMINI_API_KEY')
GEMINI_MODEL = config('GEMINI_MODEL', default='gemini-2.0-flash')
GEMINI_VISION_MODEL = config('GEMINI_VISION_MODEL', default='gemini-1.5-pro-latest')

# SW Sapiens (PAC)
SW_SAPIENS_URL = config('SW_SAPIENS_URL')
SW_SAPIENS_TOKEN = config('SW_SAPIENS_TOKEN')
SW_SAPIENS_USER = config('SW_SAPIENS_USER')
SW_SAPIENS_PASSWORD = config('SW_SAPIENS_PASSWORD')
SW_SAPIENS_PDF_URL = config('SW_SAPIENS_PDF_URL')
SW_SAPIENS_TIMEOUT = config('SW_SAPIENS_TIMEOUT', default=30, cast=int)

# SAT Encryption
SAT_ENCRYPTION_KEY = config('SAT_ENCRYPTION_KEY')
```

---

## 6. Database Schema (All 18 Models)

### 6.1 Core: Tenant + User

#### Tenant (`apps/tenants/models.py`)

```python
from django.db import models

class Tenant(models.Model):
    class Giro(models.TextChoices):
        SERVICIOS = 'servicios', 'Servicios'
        COMERCIO = 'comercio', 'Comercio'
        MANUFACTURA = 'manufactura', 'Manufactura'
        MIXTO = 'mixto', 'Mixto'
    
    class RegimenFiscal(models.TextChoices):
        RESICO_PF = 'resico_pf', 'RESICO Persona Física'
        PFAE = 'pfae', 'Persona Física con Actividad Empresarial'
        HONORARIOS = 'honorarios', 'Honorarios'
        RESICO_PM = 'resico_pm', 'RESICO Persona Moral'
    
    class Status(models.TextChoices):
        ACTIVE = 'active', 'Activo'
        SUSPENDED = 'suspended', 'Suspendido'
        CANCELLED = 'cancelled', 'Cancelado'
    
    name = models.CharField(max_length=255)
    company_name = models.CharField(max_length=255, null=True, blank=True)
    rfc = models.CharField(max_length=13, unique=True)
    giro = models.CharField(max_length=20, choices=Giro.choices, default=Giro.SERVICIOS)
    business_description = models.TextField(null=True, blank=True)
    regimen_fiscal = models.CharField(max_length=20, choices=RegimenFiscal.choices, null=True, blank=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.ACTIVE)
    onboarding_completed = models.BooleanField(default=False)
    onboarding_step = models.SmallIntegerField(default=1)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    deleted_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'tenants'
```

#### User (`apps/accounts/models.py`)

```python
from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    username = None
    email = models.EmailField(unique=True)
    tenant = models.ForeignKey('tenants.Tenant', null=True, blank=True, on_delete=models.SET_NULL)
    tenants = models.ManyToManyField('tenants.Tenant', through='tenants.UserTenant', related_name='users')
    
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['first_name', 'last_name']
    
    def accessible_tenant_ids(self):
        tenant_ids = set(self.tenants.values_list('id', flat=True))
        if self.tenant_id:
            tenant_ids.add(self.tenant_id)
        return list(tenant_ids)
```

#### UserTenant Pivot (`apps/tenants/models.py`)

```python
class UserTenant(models.Model):
    user = models.ForeignKey('accounts.User', on_delete=models.CASCADE)
    tenant = models.ForeignKey('tenants.Tenant', on_delete=models.CASCADE)
    
    class Meta:
        db_table = 'user_tenant'
        unique_together = [('user', 'tenant')]
```

### 6.2 SAT Domain

#### SatCredential (`apps/sat/models.py`)

```python
from apps.common.models import TenantMixin
from cryptography.fernet import Fernet
from django.conf import settings

class SatCredential(TenantMixin):
    tenant = models.ForeignKey('tenants.Tenant', on_delete=models.CASCADE)
    rfc = models.CharField(max_length=13)
    cer_path = models.CharField(max_length=255)
    key_path = models.CharField(max_length=255)
    password_encrypted = models.TextField()
    valid_until = models.DateField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'sat_credentials'
        unique_together = [('tenant', 'rfc')]
    
    def get_password(self):
        f = Fernet(settings.SAT_ENCRYPTION_KEY)
        return f.decrypt(self.password_encrypted.encode()).decode()
    
    def set_password(self, password):
        f = Fernet(settings.SAT_ENCRYPTION_KEY)
        self.password_encrypted = f.encrypt(password.encode()).decode()
```

#### SatDownloadRequest (`apps/sat/models.py`)

```python
class SatDownloadRequest(TenantMixin):
    class DownloadType(models.TextChoices):
        EMITIDOS = 'emitidos', 'Emitidos'
        RECIBIDOS = 'recibidos', 'Recibidos'
    
    class Status(models.TextChoices):
        PENDING = 'pending', 'Pendiente'
        QUERYING = 'querying', 'Consultando'
        VERIFYING = 'verifying', 'Verificando'
        DOWNLOADING = 'downloading', 'Descargando'
        FINISHED = 'finished', 'Finalizado'
        ERROR = 'error', 'Error'
    
    tenant = models.ForeignKey('tenants.Tenant', on_delete=models.CASCADE)
    sat_credential = models.ForeignKey(SatCredential, on_delete=models.CASCADE, related_name='download_requests')
    request_id = models.CharField(max_length=255, null=True, blank=True)
    download_type = models.CharField(max_length=20, choices=DownloadType.choices)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    date_from = models.DateField()
    date_to = models.DateField()
    packages_count = models.PositiveIntegerField(default=0)
    cfdis_count = models.PositiveIntegerField(default=0)
    error_message = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'sat_download_requests'
```

#### SatCfdi (`apps/sat/models.py`)

```python
from apps.classification.models import ExpenseCategory
from apps.vendors.models import Vendor

class SatCfdi(TenantMixin):
    class TipoComprobante(models.TextChoices):
        EMITIDOS = 'emitidos', 'Emitidos'
        RECIBIDOS = 'recibidos', 'Recibidos'
    
    class ReviewStatus(models.TextChoices):
        NONE = 'none', 'Sin revisar'
        PENDING = 'pending', 'Pendiente'
        CONFIRMED = 'confirmed', 'Confirmado'
    
    tenant = models.ForeignKey('tenants.Tenant', on_delete=models.CASCADE)
    sat_download_request = models.ForeignKey(SatDownloadRequest, on_delete=models.SET_NULL, null=True, blank=True, related_name='cfdis')
    uuid = models.UUIDField(unique=True)
    tipo_comprobante = models.CharField(max_length=20, choices=TipoComprobante.choices)
    rfc_emisor = models.CharField(max_length=13)
    nombre_emisor = models.CharField(max_length=255)
    rfc_receptor = models.CharField(max_length=13)
    nombre_receptor = models.CharField(max_length=255)
    forma_pago = models.CharField(max_length=2, null=True, blank=True)
    metodo_pago = models.CharField(max_length=3, null=True, blank=True)
    uso_cfdi = models.CharField(max_length=3, null=True, blank=True)
    fecha_emision = models.DateTimeField(null=True, blank=True)
    tipo_de_comprobante = models.CharField(max_length=1, null=True, blank=True)
    subtotal = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    total = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    retention_iva = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    retention_isr = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    moneda = models.CharField(max_length=3, default='MXN')
    estado = models.CharField(max_length=20, null=True, blank=True)
    paid_at = models.DateTimeField(null=True, blank=True)
    conceptos = models.JSONField(null=True, blank=True)
    xml_content = models.TextField(null=True, blank=True)
    category = models.ForeignKey(ExpenseCategory, on_delete=models.SET_NULL, null=True, blank=True, related_name='cfdis')
    category_confirmed = models.BooleanField(default=False)
    vendor = models.ForeignKey(Vendor, on_delete=models.SET_NULL, null=True, blank=True, related_name='cfdis')
    review_status = models.CharField(max_length=20, choices=ReviewStatus.choices, default=ReviewStatus.NONE)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'sat_cfdis'
        indexes = [
            models.Index(fields=['tenant', 'tipo_comprobante']),
            models.Index(fields=['tenant', 'rfc_emisor']),
            models.Index(fields=['tenant', 'fecha_emision']),
            models.Index(fields=['tenant', 'tipo_comprobante', 'paid_at']),
            models.Index(fields=['tenant', 'review_status']),
        ]
```

### 6.3 Classification (Global Tables)

#### ExpenseCategory (`apps/classification/models.py`)

```python
class ExpenseCategory(models.Model):
    """Global catalog - NOT tenant-scoped."""
    
    class ExpenseNature(models.TextChoices):
        COST_OF_SALES = 'cost_of_sales', 'Costo de Ventas'
        OPERATING_EXPENSE = 'operating_expense', 'Gasto Operativo'
        SELLING_EXPENSE = 'selling_expense', 'Gasto de Venta'
        FINANCIAL_EXPENSE = 'financial_expense', 'Gasto Financiero'
        OTHER_EXPENSE = 'other_expense', 'Otro Gasto'
    
    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(max_length=50, unique=True, null=True, blank=True)
    group = models.CharField(max_length=50, null=True, blank=True)
    nature = models.CharField(max_length=30, choices=ExpenseNature.choices, null=True, blank=True)
    description = models.CharField(max_length=255, null=True, blank=True)
    icon = models.CharField(max_length=50, default='tag')
    color = models.CharField(max_length=7, default='#6366f1')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'expense_categories'
```

#### VendorRule (`apps/classification/models.py`)

```python
class VendorRule(models.Model):
    """Global rules - NOT tenant-scoped."""
    rfc = models.CharField(max_length=13, null=True, blank=True, db_index=True)
    name_pattern = models.CharField(max_length=255, null=True, blank=True, db_index=True)
    category = models.ForeignKey(ExpenseCategory, on_delete=models.CASCADE, related_name='vendor_rules')
    description = models.CharField(max_length=255, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'vendor_rules'
```

#### SatClassCategoryMap (`apps/classification/models.py`)

```python
class SatClassCategoryMap(models.Model):
    """Global lookup - NOT tenant-scoped."""
    sat_class_6digits = models.CharField(max_length=6, unique=True)
    category_slug = models.CharField(max_length=30, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'sat_class_category_map'
```

#### VendorCategoryCache (`apps/classification/models.py`)

```python
class VendorCategoryCache(TenantMixin):
    tenant = models.ForeignKey('tenants.Tenant', on_delete=models.CASCADE)
    category = models.ForeignKey(ExpenseCategory, on_delete=models.CASCADE, related_name='vendor_caches')
    rfc_emisor = models.CharField(max_length=13)
    nombre_emisor = models.CharField(max_length=255)
    confidence = models.FloatField(default=0)
    times_confirmed = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'vendor_category_cache'
        unique_together = [('tenant', 'rfc_emisor')]
```

### 6.4 Vendor

#### Vendor (`apps/vendors/models.py`)

```python
from apps.common.models import TenantMixin
from apps.classification.models import ExpenseCategory

class Vendor(TenantMixin):
    tenant = models.ForeignKey('tenants.Tenant', on_delete=models.CASCADE)
    rfc = models.CharField(max_length=13)
    nombre = models.CharField(max_length=255)
    categoria_default = models.ForeignKey(ExpenseCategory, on_delete=models.SET_NULL, null=True, blank=True, related_name='vendors')
    total_pagado = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    num_facturas = models.PositiveIntegerField(default=0)
    ultima_factura_at = models.DateTimeField(null=True, blank=True)
    is_cost_of_sales = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'vendors'
        unique_together = [('tenant', 'rfc')]
        indexes = [
            models.Index(fields=['tenant', 'is_cost_of_sales']),
        ]
```

### 6.5 Tickets

#### TicketImage (`apps/tickets/models.py`)

```python
from apps.common.models import TenantMixin

class TicketImage(TenantMixin):
    tenant = models.ForeignKey('tenants.Tenant', on_delete=models.CASCADE)
    file_path = models.CharField(max_length=255)
    file_size = models.BigIntegerField()
    mime_type = models.CharField(max_length=50)
    uploaded_by = models.ForeignKey('accounts.User', on_delete=models.CASCADE, related_name='ticket_images')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'ticket_images'
        indexes = [
            models.Index(fields=['tenant', 'created_at']),
        ]
```

#### TicketExpense (`apps/tickets/models.py`)

```python
from apps.classification.models import ExpenseCategory
from apps.sat.models import SatCfdi

class TicketExpense(TenantMixin):
    class Bucket(models.TextChoices):
        EMPRESA_DEDUCIBLE = 'empresa_deducible', 'Empresa Deducible'
        EMPRESA_NO_DEDUCIBLE = 'empresa_no_deducible', 'Empresa No Deducible'
        PERSONAL = 'personal', 'Personal'
    
    class ReviewStatus(models.TextChoices):
        NONE = 'none', 'Sin revisar'
        PENDING = 'pending', 'Pendiente'
        CONFIRMED = 'confirmed', 'Confirmado'
    
    tenant = models.ForeignKey('tenants.Tenant', on_delete=models.CASCADE)
    ticket_image = models.ForeignKey(TicketImage, on_delete=models.CASCADE, related_name='ticket_expense')
    vendor = models.ForeignKey('vendors.Vendor', on_delete=models.SET_NULL, null=True, blank=True, related_name='ticket_expenses')
    rfc_emisor = models.CharField(max_length=13, null=True, blank=True)
    nombre_emisor = models.CharField(max_length=255)
    fecha_ticket = models.DateField(null=True, blank=True)
    subtotal = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    iva = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    descripcion = models.TextField(null=True, blank=True)
    bucket = models.CharField(max_length=30, choices=Bucket.choices, default=Bucket.EMPRESA_NO_DEDUCIBLE)
    expense_category = models.ForeignKey(ExpenseCategory, on_delete=models.SET_NULL, null=True, blank=True, related_name='ticket_expenses')
    has_invoice = models.BooleanField(default=False)
    linked_cfdi = models.ForeignKey(SatCfdi, on_delete=models.SET_NULL, null=True, blank=True, related_name='linked_tickets')
    confidence = models.FloatField(default=0)
    review_status = models.CharField(max_length=20, choices=ReviewStatus.choices, default=ReviewStatus.NONE)
    notes = models.TextField(null=True, blank=True)
    deleted_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'ticket_expenses'
        indexes = [
            models.Index(fields=['tenant', 'bucket']),
            models.Index(fields=['tenant', 'review_status']),
            models.Index(fields=['tenant', 'fecha_ticket']),
            models.Index(fields=['tenant', 'has_invoice']),
            models.Index(fields=['tenant', 'vendor']),
        ]
```

### 6.6 Customers / Products / Quotations

#### Customer (`apps/customers/models.py`)

```python
from apps.common.models import TenantMixin

class Customer(TenantMixin):
    tenant = models.ForeignKey('tenants.Tenant', on_delete=models.CASCADE)
    rfc = models.CharField(max_length=13)
    nombre_razon_social = models.CharField(max_length=255)
    email = models.EmailField(null=True, blank=True)
    telefono = models.CharField(max_length=30, null=True, blank=True)
    uso_cfdi_default = models.CharField(max_length=5, null=True, blank=True)
    regimen_fiscal = models.CharField(max_length=5, null=True, blank=True)
    codigo_postal = models.CharField(max_length=10, null=True, blank=True)
    direccion_fiscal = models.JSONField(null=True, blank=True)
    notes = models.TextField(null=True, blank=True)
    deleted_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'customers'
        unique_together = [('tenant', 'rfc')]
```

#### Product (`apps/products/models.py`)

```python
from apps.common.models import TenantMixin
from django.db.models import F

class Product(TenantMixin):
    tenant = models.ForeignKey('tenants.Tenant', on_delete=models.CASCADE)
    descripcion = models.CharField(max_length=255)
    clave_prod_serv_sat = models.CharField(max_length=8)
    unidad_sat = models.CharField(max_length=10, null=True, blank=True)
    precio_unitario = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    iva_aplicable = models.BooleanField(default=True)
    veces_usado = models.PositiveIntegerField(default=0)
    deleted_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'products_catalog'
    
    def bump_usage(self):
        Product.objects.filter(pk=self.pk).update(veces_usado=F('veces_usado') + 1)
        self.veces_usado += 1
```

#### Quotation (`apps/quotations/models.py`)

```python
import secrets
from datetime import datetime
from apps.common.models import TenantMixin
from apps.customers.models import Customer
from apps.sat.models import SatCfdi

class Quotation(TenantMixin):
    class Status(models.TextChoices):
        BORRADOR = 'borrador', 'Borrador'
        ENVIADA = 'enviada', 'Enviada'
        VENDIDA = 'vendida', 'Vendida'
        FACTURADA = 'facturada', 'Facturada'
        CANCELADA = 'cancelada', 'Cancelada'
    
    tenant = models.ForeignKey('tenants.Tenant', on_delete=models.CASCADE)
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name='quotations')
    folio = models.CharField(max_length=20)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.BORRADOR)
    subtotal = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    iva = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    mensaje_cliente = models.TextField(null=True, blank=True)
    public_token = models.CharField(max_length=64, unique=True)
    valid_until = models.DateField(null=True, blank=True)
    viewed_at = models.DateTimeField(null=True, blank=True)
    accepted_at = models.DateTimeField(null=True, blank=True)
    sold_at = models.DateTimeField(null=True, blank=True)
    invoiced_at = models.DateTimeField(null=True, blank=True)
    cfdi = models.ForeignKey(SatCfdi, on_delete=models.SET_NULL, null=True, blank=True, related_name='quotations')
    deleted_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'quotations'
        unique_together = [('tenant', 'folio')]
    
    def save(self, *args, **kwargs):
        if not self.folio:
            self.folio = self.generate_folio(self.tenant_id)
        if not self.public_token:
            self.public_token = self.generate_public_token()
        super().save(*args, **kwargs)
    
    @staticmethod
    def generate_folio(tenant_id):
        year_month = datetime.now().strftime('%y%m')
        prefix = f'COT-{year_month}-'
        last = Quotation.objects.filter(tenant_id=tenant_id, folio__startswith=prefix).order_by('-folio').first()
        num = int(last.folio.split('-')[-1]) + 1 if last else 1
        return f"{prefix}{num:04d}"
    
    @staticmethod
    def generate_public_token():
        return secrets.token_urlsafe(48)
    
    def is_editable(self):
        return self.status == self.Status.BORRADOR
```

#### QuotationItem (`apps/quotations/models.py`)

```python
from apps.products.models import Product

class QuotationItem(models.Model):
    quotation = models.ForeignKey(Quotation, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.SET_NULL, null=True, blank=True, related_name='quotation_items')
    descripcion = models.CharField(max_length=255)
    cantidad = models.DecimalField(max_digits=12, decimal_places=2)
    precio_unitario = models.DecimalField(max_digits=12, decimal_places=2)
    descuento = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    importe = models.DecimalField(max_digits=12, decimal_places=2)
    iva = models.DecimalField(max_digits=12, decimal_places=2)
    total = models.DecimalField(max_digits=12, decimal_places=2)
    clave_prod_serv_sat = models.CharField(max_length=8, null=True, blank=True)
    unidad_sat = models.CharField(max_length=10, null=True, blank=True)
    orden = models.SmallIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'quotation_items'
        ordering = ['orden']
```

### 6.7 Chat

#### ChatConversation (`apps/chat/models.py`)

```python
from apps.common.models import TenantMixin

class ChatConversation(TenantMixin):
    class Status(models.TextChoices):
        ACTIVE = 'active', 'Activo'
        ARCHIVED = 'archived', 'Archivado'
    
    tenant = models.ForeignKey('tenants.Tenant', on_delete=models.CASCADE)
    user = models.ForeignKey('accounts.User', on_delete=models.CASCADE, related_name='chat_conversations')
    title = models.CharField(max_length=255, null=True, blank=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.ACTIVE)
    metadata = models.JSONField(null=True, blank=True)
    deleted_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'chat_conversations'
    
    @staticmethod
    def title_from_first_message(first_message):
        return first_message[:60].strip()
```

#### ChatMessage (`apps/chat/models.py`)

```python
class ChatMessage(models.Model):
    class Role(models.TextChoices):
        USER = 'user', 'Usuario'
        ASSISTANT = 'assistant', 'Asistente'
        SYSTEM = 'system', 'Sistema'
        TOOL = 'tool', 'Herramienta'
    
    conversation = models.ForeignKey(ChatConversation, on_delete=models.CASCADE, related_name='messages')
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
```

### 6.8 Notifications

#### Notification (`apps/notifications/models.py`)

```python
from django.utils import timezone
from apps.common.models import TenantMixin

class Notification(TenantMixin):
    tenant = models.ForeignKey('tenants.Tenant', on_delete=models.CASCADE)
    user = models.ForeignKey('accounts.User', on_delete=models.CASCADE, null=True, blank=True, related_name='notifications')
    type = models.CharField(max_length=50)
    title = models.CharField(max_length=255)
    body = models.TextField()
    data = models.JSONField(null=True, blank=True)
    read_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'notifications'
        indexes = [
            models.Index(fields=['tenant', 'read_at']),
            models.Index(fields=['tenant', 'user', 'read_at']),
            models.Index(fields=['tenant', 'type', 'created_at']),
        ]
    
    def mark_as_read(self):
        if not self.read_at:
            self.read_at = timezone.now()
            self.save(update_fields=['read_at', 'updated_at'])
```

---

## 7. Multitenancy Pattern

### 7.1 TenantManager (`apps/common/managers.py`)

```python
from django.db import models
from apps.common.middleware import get_current_tenant_id

class TenantManager(models.Manager):
    def get_queryset(self):
        tenant_id = get_current_tenant_id()
        if tenant_id:
            return super().get_queryset().filter(tenant_id=tenant_id)
        return super().get_queryset()

class UnfilteredManager(models.Manager):
    pass
```

### 7.2 TenantMixin (`apps/common/models.py`)

```python
from django.db import models
from apps.common.managers import TenantManager, UnfilteredManager
from apps.common.middleware import get_current_tenant_id

class TenantMixin(models.Model):
    tenant = models.ForeignKey('tenants.Tenant', on_delete=models.CASCADE)
    objects = TenantManager()
    all_objects = UnfilteredManager()
    
    class Meta:
        abstract = True
    
    def save(self, *args, **kwargs):
        if not self.tenant_id:
            self.tenant_id = get_current_tenant_id()
        super().save(*args, **kwargs)
```

### 7.3 Middleware (`apps/common/middleware.py`)

```python
import contextvars

_current_tenant_id = contextvars.ContextVar('current_tenant_id', default=None)

def get_current_tenant_id():
    return _current_tenant_id.get()

def set_current_tenant_id(tenant_id):
    return _current_tenant_id.set(tenant_id)

class EnsureTenantContext:
    def __init__(self, get_response):
        self.get_response = get_response
    
    def __call__(self, request):
        if request.user.is_authenticated and hasattr(request.user, 'tenant_id'):
            if request.user.tenant_id:
                set_current_tenant_id(request.user.tenant_id)
            else:
                from django.http import HttpResponseForbidden
                return HttpResponseForbidden('No tenant context')
        
        response = self.get_response(request)
        set_current_tenant_id(None)
        return response
```

---

## 8. API Routes (65 Endpoints)

All routes prefixed with `/api/v1/`.

### 8.1 Public Routes (no auth)

| Method | Endpoint | View | Description |
|--------|----------|------|-------------|
| GET | `/public/quotations/{token}` | `quotations::PublicQuotationView` | Get quotation by token |
| POST | `/public/quotations/{token}/accept` | `quotations::PublicQuotationAcceptView` | Accept quotation |
| GET | `/public/quotations/{token}/pdf` | `quotations::PublicQuotationPdfView` | Download PDF |

### 8.2 Auth Routes

| Method | Endpoint | View | Auth | Description |
|--------|----------|------|------|-------------|
| POST | `/auth/register` | `accounts::RegisterView` | None | Register |
| POST | `/auth/login` | `accounts::LoginView` | None | Login |
| POST | `/auth/logout` | `accounts::LogoutView` | JWT | Logout |
| GET | `/auth/me` | `accounts::MeView` | JWT | Get current user |

### 8.3 Authenticated Routes

| Method | Endpoint | View | Description |
|--------|----------|------|-------------|
| **SAT** | | | |
| GET | `/sat/credentials` | `sat::SatCredentialListView` | List credentials |
| POST | `/sat/credentials` | `sat::SatCredentialCreateView` | Upload certificates |
| GET | `/sat/cfdis` | `sat::SatCfdiListView` | List CFDIs |
| PATCH | `/sat/cfdis/{id}/category` | `sat::SatCfdiUpdateCategoryView` | Update category |
| **Onboarding** | | | |
| GET | `/onboarding/top-vendors` | `tenants::OnboardingTopVendorsView` | Top vendors |
| POST | `/onboarding/mark-cost-of-sales-vendors` | `tenants::OnboardingMarkCostOfSalesView` | Mark vendors |
| POST | `/onboarding/business-info` | `tenants::OnboardingBusinessInfoView` | Save business info |
| POST | `/onboarding/sat-connect` | `tenants::OnboardingSatConnectView` | Connect SAT |
| GET | `/onboarding/sat-status` | `tenants::OnboardingSatStatusView` | SAT status |
| POST | `/onboarding/complete` | `tenants::OnboardingCompleteView` | Complete onboarding |
| **Vendors** | | | |
| PATCH | `/vendors/{id}/toggle-cost-of-sales` | `vendors::VendorToggleCostOfSalesView` | Toggle flag |
| **CFDI Review** | | | |
| GET | `/cfdis/pending-review` | `sat::CfdiReviewListView` | Pending review list |
| GET | `/cfdis/pending-review/count` | `sat::CfdiReviewCountView` | Pending count |
| POST | `/cfdis/{id}/confirm-category` | `sat::CfdiConfirmCategoryView` | Confirm category |
| **Dashboard** | | | |
| GET | `/dashboard/business` | `dashboard::DashboardBusinessView` | Business dashboard |
| GET | `/dashboard/fiscal` | `dashboard::DashboardFiscalView` | Fiscal dashboard |
| GET | `/dashboard/personal` | `dashboard::DashboardPersonalView` | Personal dashboard |
| **Lists** | | | |
| GET | `/expenses` | `sat::ExpenseListView` | List expenses |
| GET | `/expenses/export` | `sat::ExpenseExportView` | Export expenses |
| GET | `/sales` | `sat::SalesListView` | List sales |
| GET | `/sales/export` | `sat::SalesExportView` | Export sales |
| GET | `/vendors` | `vendors::VendorListView` | List vendors |
| GET | `/vendors/export` | `vendors::VendorExportView` | Export vendors |
| GET | `/customers/from-cfdis` | `customers::CustomerFromCfdisListView` | Customers from CFDIs |
| GET | `/customers/export` | `customers::CustomerExportView` | Export customers |
| GET | `/customers/search` | `customers::CustomerSearchView` | Search customers |
| **Customers CRUD** | | | |
| GET | `/customers` | `customers::CustomerListView` | List customers |
| POST | `/customers` | `customers::CustomerCreateView` | Create customer |
| GET | `/customers/{id}` | `customers::CustomerDetailView` | Get customer |
| PATCH | `/customers/{id}` | `customers::CustomerUpdateView` | Update customer |
| DELETE | `/customers/{id}` | `customers::CustomerDeleteView` | Delete customer |
| **Products** | | | |
| GET | `/products/search` | `products::ProductSearchView` | Search products |
| POST | `/products/` | `products::ProductCreateView` | Create product |
| PATCH | `/products/{id}` | `products::ProductUpdateView` | Update product |
| **Quotations** | | | |
| GET | `/quotations/` | `quotations::QuotationListView` | List quotations |
| POST | `/quotations/` | `quotations::QuotationCreateView` | Create quotation |
| GET | `/quotations/{id}` | `quotations::QuotationDetailView` | Get quotation |
| PATCH | `/quotations/{id}` | `quotations::QuotationUpdateView` | Update quotation |
| DELETE | `/quotations/{id}` | `quotations::QuotationDeleteView` | Delete quotation |
| POST | `/quotations/{id}/send` | `quotations::QuotationSendView` | Mark as sent |
| POST | `/quotations/{id}/convert-to-sale` | `quotations::QuotationConvertToSaleView` | Mark as sold |
| POST | `/quotations/{id}/invoice` | `quotations::QuotationInvoiceView` | Issue CFDI |
| POST | `/quotations/{id}/cancel` | `quotations::QuotationCancelView` | Cancel quotation |
| **Chat** | | | |
| POST | `/chat/send` | `chat::ChatSendView` | Send message (SSE) |
| GET | `/chat/conversations` | `chat::ChatConversationListView` | List conversations |
| POST | `/chat/conversations` | `chat::ChatConversationCreateView` | Create conversation |
| GET | `/chat/conversations/{id}` | `chat::ChatConversationDetailView` | Get conversation |
| PATCH | `/chat/conversations/{id}` | `chat::ChatConversationUpdateView` | Rename conversation |
| DELETE | `/chat/conversations/{id}` | `chat::ChatConversationDeleteView` | Delete conversation |
| **CFDI Emission** | | | |
| POST | `/cfdi/{id}/cancel` | `sat::CfdiCancelView` | Cancel CFDI |
| POST | `/cfdi/{id}/resend-email` | `sat::CfdiResendEmailView` | Resend email |
| GET | `/cfdi/{id}/xml` | `sat::CfdiXmlView` | Download XML |
| GET | `/cfdi/{id}/pdf` | `sat::CfdiPdfView` | Download PDF |
| **Receivables** | | | |
| GET | `/receivables/` | `sat::ReceivablesListView` | List receivables |
| POST | `/receivables/{cfdiId}/send-reminder` | `sat::ReceivablesSendReminderView` | Send reminder |
| **Notifications** | | | |
| GET | `/notifications/` | `notifications::NotificationListView` | List notifications |
| GET | `/notifications/count` | `notifications::NotificationUnreadCountView` | Unread count |
| PATCH | `/notifications/{id}/read` | `notifications::NotificationMarkReadView` | Mark as read |
| POST | `/notifications/mark-all-read` | `notifications::NotificationMarkAllReadView` | Mark all read |
| **Tickets** | | | |
| POST | `/tickets/upload` | `tickets::TicketUploadView` | Upload ticket |
| GET | `/tickets/` | `tickets::TicketListView` | List tickets |
| GET | `/tickets/pending-review` | `tickets::TicketPendingReviewListView` | Pending review |
| GET | `/tickets/pending-review/count` | `tickets::TicketPendingCountView` | Pending count |
| GET | `/tickets/{id}` | `tickets::TicketDetailView` | Get ticket |
| PATCH | `/tickets/{id}` | `tickets::TicketUpdateView` | Update ticket |
| DELETE | `/tickets/{id}` | `tickets::TicketDeleteView` | Delete ticket |
| POST | `/tickets/{id}/confirm` | `tickets::TicketConfirmView` | Confirm ticket |
| POST | `/tickets/{id}/link-cfdi/{cfdiId}` | `tickets::TicketLinkCfdiView` | Link to CFDI |
| POST | `/tickets/{id}/accept-link/{cfdiId}` | `tickets::TicketAcceptLinkView` | Accept link |

---

## 9. Services (Business Logic)

### 9.1 AuthService (`apps/accounts/services.py`)

- `register(data)` - Creates Tenant + User in transaction, returns JWT
- `login(credentials)` - Authenticates user, returns JWT

### 9.2 DashboardService (`apps/dashboard/services/dashboard_service.py`)

- `business(tenant_id, month)` - Profit, sales, expenses, charts, insights
- `fiscal(tenant_id, month)` - IVA, ISR, income statement
- `personal(tenant_id, month)` - Liquidity, personal expenses

### 9.3 ExpenseClassificationService (`apps/classification/services.py`)

**5-layer pipeline:**

```python
def classify(cfdi):
    # Layer 0: Vendor is_cost_of_sales
    if cfdi.vendor and cfdi.vendor.is_cost_of_sales:
        return resolve_cost_of_sales_category(cfdi.tenant.giro)
    
    # Layer 1: TipoDeComprobante (N=Sueldos, T=Fletes, E=null)
    if cfdi.tipo_de_comprobante == 'N':
        return get_category_by_slug('sueldos_salarios')
    
    # Layer 2: ClaveProdServ from conceptos
    for concepto in cfdi.conceptos:
        clave = concepto.get('clave_prod_serv')
        if clave:
            mapping = SatClassCategoryMap.objects.filter(sat_class_6digits=clave[:6]).first()
            if mapping:
                return ExpenseCategory.objects.get(slug=mapping.category_slug)
    
    # Layer 3: VendorRule (RFC or name pattern)
    rule = VendorRule.objects.filter(rfc=cfdi.rfc_emisor).first()
    if not rule:
        for rule in VendorRule.objects.exclude(name_pattern__isnull=True):
            if re.search(rule.name_pattern, cfdi.nombre_emisor, re.IGNORECASE):
                return rule.category
    
    # Layer 4a: VendorCategoryCache
    cache = VendorCategoryCache.objects.filter(tenant=cfdi.tenant, rfc_emisor=cfdi.rfc_emisor).first()
    if cache and cache.confidence >= 0.7:
        return cache.category
    
    # Layer 4b: Gemini AI
    return gemini_service.classify(cfdi)
```

- `confirm_category(cfdi, category)` - Updates CFDI + cache
- `maybe_mark_for_review(cfdi)` - Marks pending if confidence < 0.7

### 9.4 VendorCostOfSalesService (`apps/vendors/services.py`)

- `mark_vendors_and_reclassify(tenant_id, vendor_ids)` - Marks vendors, reclassifies CFDIs
- `resolve_cost_of_sales_category(giro)` - Returns inventario_mercancia or materias_primas

### 9.5 CfdiEmissionService (`apps/sat/services/emission_service.py`)

- `emit_from_quotation(quotation)` - Validates, builds payload, calls PAC, saves XML/PDF
- `validate_for_emission(quotation)` - Checks status, customer, items, credentials
- `build_cfdi_payload(quotation)` - Builds SW Sapiens JSON (CFDI 4.0)
- `save_timbrado_result(quotation, result)` - Persists XML/PDF, creates SatCfdi
- `cancel_cfdi(cfdi, motivo, folio_sustituto)` - Cancels via PAC
- `send_cfdi_by_email(cfdi)` - Stub

### 9.6 QuotationService (`apps/quotations/services/quotation_service.py`)

- `create(tenant_id, data)` - Creates quotation + items, feeds product catalog
- `update(quotation, data)` - Only for borradores
- `sync_items(quotation, items_data)` - Creates items with calculated totals
- `recalculate_totals(quotation)` - Sums items, updates quotation

### 9.7 QuotationPdfService (`apps/quotations/services/pdf_service.py`)

- `stream_pdf(quotation)` - Generates PDF via WeasyPrint with QR code
- `render_pdf(quotation)` - Returns PDF as bytes

### 9.8 ProductCatalogService (`apps/products/services.py`)

- `record_usage(tenant_id, descripcion, ...)` - Finds/creates product, bumps usage
- `record_quotation_items(tenant_id, items)` - Batch version
- `search_for_autocomplete(tenant_id, term, limit)` - LIKE search ordered by usage

### 9.9 GeminiService (`services/gemini_service.py`)

- `classify(cfdi)` - Classifies via Gemini Flash (53 categories, 10 groups)
- `parse_ticket_image(image_path, tenant)` - OCR via Gemini Pro Vision

### 9.10 FinancialStatementService (`apps/dashboard/services/financial.py`)

- `get_income_statement(tenant_id, start, end)` - NIF B-3 structure
- `get_margins()` - Percentage margins
- `resolve_nature(category, giro)` - Dynamic nature based on giro

### 9.11 InsightsService (`apps/dashboard/services/insights.py`)

- `for_business(tenant_id, month)` - Up to 3 insights: overdue receivables, unusual expenses, profit comparison, top category, sales YoY

### 9.12 NotificationGeneratorService (`apps/notifications/services/generators.py`)

- `run_for_all_tenants()` - Iterates tenants
- `run_for_tenant(tenant)` - 3 generators: overdue receivables, unusual expenses, late invoice links

### 9.13 SpreadsheetExportService (`services/export_service.py`)

- `stream_xlsx(filename, headers, rows, column_types)` - Generates .xlsx with openpyxl

### 9.14 SatGoClient (`apps/sat/services/sat_go_client.py`)

REST client for SAT-Go API — handles FIEL and CIEC auth, CFDI downloads, OC, CSF, declaraciones, and fiscal info.

- `create_key(portal_token)` - Generates API key from portal token
- `generate_token(api_key)` - Gets JWT from API key
- `consultar_facturas(rfc, date_from, date_to, auth_type, ...)` - Invoice queries (FIEL multipart or CIEC header)
- `descargar_oc(rfc, auth_type, ...)` - Opinión de Cumplimiento PDF → base64
- `descargar_csf(rfc, auth_type, ...)` - Constancia Situación Fiscal PDF → base64
- `descargar_dec(rfc, auth_type, ...)` - Declaraciones ZIP → base64
- `consultar_info_fiscal(rfc, auth_type, ...)` - Fiscal info JSON

FIEL: multipart POST with `.key` + `.cer` files. CIEC: `Secret` header.

### 9.15 SatCfdiParser (`apps/sat/services/cfdi_parser.py`)

- `parse(xml_content)` - Parses CFDI 4.0 XML via lxml + XPath

### 9.16 EnlaceFiscalService (`apps/sat/services/enlace_fiscal_service.py`)

PAC REST client for CFDI 4.0 timbrado, cancel, and PDF generation. Replaces SW Sapiens.

- `timbrar(cfdi_payload)` - Stamps CFDI 4.0 via `POST /v6/generarCfdi`
- `cancelar(uuid, motivo, folio_sustituto)` - Cancels CFDI via `POST /v6/cancelarCfdi`
- `consultar_estatus(uuid)` - Gets CFDI info via `POST /v6/informacionCfdi`
- `probar_conexion()` - Tests connection via `POST /v6/probarConexion`
- `obtener_saldo()` - Account balance via `POST /v6/obtenerSaldo`
- `enviar_correo(uuid, email)` - Sends CFDI email

Auth: HTTP Basic (user:token) + `x-api-key` header.

### 9.17 TicketParsingService (`apps/tickets/services/parsing_service.py`)

- `upload_and_parse(uploaded_file, user)` - Stores image, OCR, detects duplicates, resolves vendor/category
- `confirm_ticket(ticket, bucket, category, notes)` - Human confirmation, feeds cache
- `link_to_invoice(ticket, cfdi)` - Links ticket to CFDI
- `find_duplicate(tenant_id, parsed)` - 5% tolerance, 1-day window

### 9.18 TicketCfdiReconciliationService (`apps/tickets/services/reconciliation.py`)

- `find_candidates_for_cfdi(cfdi)` - Finds matching tickets (5% total, 15-day date, RFC/name)
- `suggest_link_on_new_cfdi(cfdi)` - If 1 candidate, adds "[Sugerencia]" note

### 9.19 ChatService (`apps/chat/services/chat_service.py`)

- `send(conversation, message)` - Loads 20 messages, builds prompt, tool loop, hallucination check
- `send_stream(conversation, message)` - SSE streaming with events: start, token, tool_call, tool_result, warning, done, error

### 9.20 AIProviderInterface + GeminiProvider (`services/ai/`)

- `chat(messages, tools)` - Non-streaming
- `chat_stream(messages, tools)` - SSE streaming via httpx

### 9.21 ChatToolRegistry (`apps/chat/services/tools.py`)

**13 tools:**

**Read (8):**
1. `get_dashboard_business`
2. `get_dashboard_fiscal`
3. `get_receivables`
4. `search_expenses`
5. `search_invoices`
6. `find_customer`
7. `get_pending_review`
8. `get_top_vendors`

**Write (4):**
9. `create_quotation`
10. `confirm_cfdi_category`
11. `mark_vendor_as_cost_of_sales`
12. `send_receivable_reminder`

**Vision (1):**
13. `parse_ticket_from_image`

### 9.22 HallucinationDetector (`apps/chat/services/hallucination.py`)

**4 detectors:**
1. `detects_success_without_tools()` - Regex for success claims without tool OK
2. `detects_hallucinated_folios()` - Validates COT-YYMM-NNNN, UUIDs, RFCs
3. `any_mutation_tool_succeeded()` - Gate check
4. `any_mutation_tool_failed()` - Log helper

### 9.23 SystemPromptBuilder (`apps/chat/services/prompt_builder.py`)

- `build(tenant)` - Tenant context, date/timezone, 15 anti-hallucination rules, tool instructions

---

## 10. Celery Jobs

### 10.1 ClassifyCfdiTask (`apps/sat/tasks.py`)

```python
@shared_task(bind=True, max_retries=2, soft_time_limit=30)
def classify_cfdi_task(self, cfdi_id):
    cfdi = SatCfdi.objects.get(id=cfdi_id)
    if cfdi.tipo_comprobante != 'recibidos' or cfdi.category_id:
        return
    
    service = ExpenseClassificationService()
    category = service.classify(cfdi)
    if category:
        cfdi.category = category
        cfdi.save(update_fields=['category'])
    service.maybe_mark_for_review(cfdi)
```

### 10.2 SatDownloadTask (`apps/sat/tasks.py`)

```python
@shared_task(bind=True, max_retries=3, soft_time_limit=300)
def sat_download_task(self, credential_id, download_type, date_from, date_to):
    credential = SatCredential.objects.get(id=credential_id)
    request = SatDownloadRequest.objects.create(...)
    
    client = SatGoClient()
    
    # Authenticate: FIEL (multipart) or CIEC (header)
    client.auth(credential)
    
    # Download facturas as JSON from SAT-Go
    facturas = client.consultar_facturas(
        credential.rfc,
        date_from.isoformat(),
        date_to.isoformat(),
    )
    
    # Parse each CFDI, save, dispatch classification
    parser = SatCfdiParser()
    for factura in facturas:
        cfdi = parser.parse_and_save(factura, credential, request)
        classify_cfdi_task.delay(cfdi.id)
```

---

## 11. Signals

### 11.1 SatCfdi post_save (`apps/sat/signals.py`)

```python
@receiver(post_save, sender=SatCfdi)
def on_cfdi_created(sender, instance, created, **kwargs):
    if not created or instance.tipo_comprobante != 'recibidos':
        return
    
    # Sync vendor
    vendor, _ = Vendor.objects.get_or_create(
        tenant=instance.tenant,
        rfc=instance.rfc_emisor,
        defaults={'nombre': instance.nombre_emisor}
    )
    vendor.total_pagado += instance.total
    vendor.num_facturas += 1
    vendor.save()
    instance.vendor = vendor
    instance.save(update_fields=['vendor'])
    
    # Suggest ticket link
    TicketCfdiReconciliationService().suggest_link_on_new_cfdi(instance)
    
    # Dispatch classification
    classify_cfdi_task.delay(instance.id)
```

---

## 12. External Integrations

### 12.1 SAT-Go (`apps/sat/services/sat_go_client.py`)

- Library: `httpx`
- Third-party API proxy for SAT (Mexican tax authority)
- Modules: auth, facturas, oc, csf, dec, info_fiscal
- Auth methods: FIEL (multipart POST with `.key` + `.cer`) or CIEC (header)
- File responses: `{"pdf_base64": "...", "file_name": "...", "content_type": "..."}`
- See [AUDIT.md](AUDIT.md) for full module documentation

### 12.2 Enlace Fiscal PAC (`apps/sat/services/enlace_fiscal_service.py`)

- Library: `httpx`
- Base URL: `https://api.enlacefiscal.com/v6`
- Key endpoints: `/generarCfdi` (timbrado 4.0), `/cancelarCfdi`, `/informacionCfdi`, `/listarComprobantes`, `/enviarCorreo`
- Auth: HTTP Basic (`user:token`) + `x-api-key` header
- Also: CFDI 4.0 timbrado, REP 2.0, retenciones, carta porte 3.1, PDF layouts, catálogos SAT
- Docs: https://developer.enlacefiscal.com/

### 12.3 Gemini AI (`services/gemini_service.py`)

- Library: `httpx`
- Endpoints: `generateContent`, `streamGenerateContent?alt=sse`
- Models: `gemini-2.0-flash` (classify), `gemini-1.5-pro-latest` (vision)

### 12.4 Cloudflare R2 (`config/settings/base.py`)

- Library: `django-storages` with `boto3`
- S3-compatible endpoint

---

## 13. Environment Variables

```env
# Django
SECRET_KEY=your-secret-key
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# Database
DB_NAME=prisma_db
DB_USER=prisma_user
DB_PASSWORD=your-password
DB_HOST=localhost
DB_PORT=5432

# Redis / Celery
REDIS_URL=redis://localhost:6379/1
CELERY_BROKER_URL=redis://localhost:6379/0
CELERY_RESULT_BACKEND=redis://localhost:6379/0

# CORS
CORS_ALLOWED_ORIGINS=http://localhost:4200,http://localhost:3000,exp://localhost:8081

# Cloudflare R2
R2_ACCESS_KEY_ID=your-access-key
R2_SECRET_ACCESS_KEY=your-secret-key
R2_BUCKET_NAME=prisma-storage
R2_ENDPOINT_URL=https://your-account-id.r2.cloudflarestorage.com

# Gemini AI
GEMINI_API_KEY=your-gemini-api-key
GEMINI_MODEL=gemini-2.0-flash
GEMINI_VISION_MODEL=gemini-1.5-pro-latest

# Enlace Fiscal PAC
ENLACE_FISCAL_URL=https://api.enlacefiscal.com
ENLACE_FISCAL_API_KEY=your-api-key
ENLACE_FISCAL_USER=your-rfc
ENLACE_FISCAL_PASSWORD=your-token

# SAT-Go
SAT_GO_BASE_URL=
SAT_GO_API_KEY=

# SAT Encryption
SAT_ENCRYPTION_KEY=your-fernet-key
```

---

## 13.5 SAT-Go Python Client — Audit (from AUDIT.md)

A Flask proxy that wraps the SAT-Go API (Mexican tax authority). Takes simple form inputs from a web UI, calls the real SAT-Go endpoints via `requests`, and returns results as JSON.

**Architecture:** Flask app → SAT-Go API → SAT servers

| Module | Endpoint | Returns |
|--------|----------|---------|
| auth | `POST /api/auth/crear-key` | API Key from portal token |
| auth | `POST /api/auth/generar-token` | JWT from API Key |
| facturas | `POST /api/facturas/consultar` | Invoice list (JSON) |
| oc | `POST /api/oc/descargar` | Opinión de Cumplimiento (PDF base64) |
| csf | `POST /api/csf/descargar` | Constancia Situación Fiscal (PDF base64) |
| dec | `POST /api/dec/descargar` | Declaraciones (ZIP base64) |
| info_fiscal | `POST /api/info-fiscal/consultar` | Fiscal info (JSON) |

Each module supports two auth methods:
- **FIEL**: multipart POST with `.key` + `.cer` files
- **CIEC**: GET request with `Secret` header

**Django Port Files:**
```
config.py          — SAT-Go URLs
views.py           — 6 views (auth, facturas, oc, csf, dec, info_fiscal)
urls.py            — URL patterns
sat_client.py      — HTTP calls to SAT-Go (the services/ logic)
```

**Key notes:**
- BASE_URL must be configured before anything works
- SSL disabled (verify=False) — needs proper certs in production
- FIEL requires file uploads → React Native needs file picking + FormData
- PDF/ZIP as base64 JSON responses
- All routes are POST (even CIEC queries)
- `requests` only — no async, no connection pooling, no retry logic (consider httpx for production)

---

# PART 2: REACT NATIVE MOBILE APP

## 14. Frontend Stack

| Layer | Package | Version | Purpose |
|-------|---------|---------|---------|
| **Framework** | React Native | 0.86+ | Mobile framework |
| **Router** | @react-navigation/native | 7+ | Navigation |
| **UI** | NativeWind | 4+ | Tailwind CSS for RN |
| **State (Client)** | Zustand | 5+ | Client state |
| **State (Server)** | @tanstack/react-query | 5+ | Server state, caching |
| **Forms** | react-hook-form | 7+ | Form management |
| **Validation** | zod | 3+ | Schema validation |
| **HTTP** | fetch (native) | - | API calls |
| **Auth Storage** | react-native-keychain | - | Secure token storage |
| **Camera** | react-native-image-picker | - | Image selection |
| **Voice** | @react-native-voice/voice | - | Speech-to-text |
| **Markdown** | react-native-markdown-display | - | Markdown rendering |
| **PDF** | react-native-print | - | PDF viewing |
| **Charts** | victory-native | 41+ | Dashboard charts |
| **Icons** | react-native-vector-icons | - | Icon library |
| **Date** | date-fns | 3+ | Date formatting |

---

## 15. Frontend Setup

### 15.1 Create React Native Project

```bash
npx @react-native-community/cli init FintorMobile
cd FintorMobile

npm install @react-navigation/native @react-navigation/native-stack @react-navigation/bottom-tabs
npm install zustand @tanstack/react-query react-hook-form zod
npm install react-native-keychain react-native-image-picker
npm install @react-native-voice/voice
npm install react-native-markdown-display react-native-print
npm install victory-native date-fns
npm install @react-native-async-storage/async-storage

npm install nativewind
npm install --save-dev tailwindcss@3.4.0
npx tailwindcss init
```

### 15.2 Configure Tailwind

**tailwind.config.js:**
```javascript
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './components/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: '#6366f1', dark: '#4f46e5', hover: '#4338ca' },
        sidebar: '#0f1117',
        page: '#f8fafc',
        text: { primary: '#1e293b', secondary: '#334155', muted: '#64748b' },
        border: '#e2e8f0',
        danger: '#ef4444',
        warning: '#fbbf24',
      },
      fontFamily: { sans: ['Inter', 'System'] },
    },
  },
  plugins: [],
};
```

### 15.3 Run Development Server

```bash
npx react-native start
```

---

## 16. Frontend Project Structure

```
prisma-mobile/
├── app/                              # Navigation screens
│   ├── (auth)/                       # Unauthenticated
│   │   ├── _layout.tsx
│   │   ├── login.tsx
│   │   └── register.tsx
│   ├── (onboarding)/                 # Onboarding
│   │   ├── _layout.tsx
│   │   ├── business-info.tsx
│   │   ├── sat-connect.tsx
│   │   ├── sat-status.tsx
│   │   └── complete.tsx
│   ├── (app)/                        # Authenticated
│   │   ├── _layout.tsx               # Tab + Drawer
│   │   ├── index.tsx                 # Dashboard
│   │   ├── chat/
│   │   │   ├── _layout.tsx
│   │   │   ├── index.tsx
│   │   │   └── [id].tsx
│   │   ├── tickets/
│   │   │   ├── _layout.tsx
│   │   │   ├── index.tsx
│   │   │   ├── upload.tsx
│   │   │   ├── [id].tsx
│   │   │   └── review.tsx
│   │   ├── quotations/
│   │   │   ├── _layout.tsx
│   │   │   ├── index.tsx
│   │   │   ├── create.tsx
│   │   │   └── [id].tsx
│   │   ├── customers/
│   │   │   ├── _layout.tsx
│   │   │   ├── index.tsx
│   │   │   ├── create.tsx
│   │   │   └── [id].tsx
│   │   ├── products/
│   │   │   ├── _layout.tsx
│   │   │   ├── index.tsx
│   │   │   └── create.tsx
│   │   ├── vendors/
│   │   │   ├── _layout.tsx
│   │   │   └── index.tsx
│   │   ├── cfdis/
│   │   │   ├── _layout.tsx
│   │   │   ├── index.tsx
│   │   │   └── review.tsx
│   │   ├── notifications.tsx
│   │   └── settings/
│   │       ├── _layout.tsx
│   │       ├── index.tsx
│   │       ├── profile.tsx
│   │       └── sat-credentials.tsx
│   └── _layout.tsx                   # Root layout
├── components/                       # Shared UI
│   ├── ui/                           # Button, Input, Card, etc.
│   ├── chat/                         # MessageBubble, MessageInput
│   ├── dashboard/                    # MetricCard, TrendChart
│   └── tickets/                      # TicketCard, TicketImage
├── lib/                              # Utilities
│   ├── api.ts                        # API client
│   ├── auth-store.ts                 # Zustand auth store
│   ├── secure-storage.ts             # expo-secure-store wrapper
│   ├── theme.ts                      # Design tokens
│   └── sse.ts                        # SSE streaming
├── hooks/                            # TanStack Query hooks
│   ├── use-auth.ts
│   ├── use-dashboard.ts
│   ├── use-chat.ts
│   ├── use-tickets.ts
│   ├── use-quotations.ts
│   ├── use-customers.ts
│   └── use-products.ts
├── schemas/                          # Zod validation
│   ├── auth.schema.ts
│   ├── customer.schema.ts
│   ├── quotation.schema.ts
│   └── ticket.schema.ts
├── types/                            # TypeScript interfaces
│   ├── auth.types.ts
│   ├── dashboard.types.ts
│   ├── chat.types.ts
│   ├── cfdi.types.ts
│   ├── vendor.types.ts
│   ├── customer.types.ts
│   ├── product.types.ts
│   ├── quotation.types.ts
│   ├── ticket.types.ts
│   └── notification.types.ts
└── constants/                        # App constants
    ├── colors.ts
    ├── endpoints.ts
    └── storage-keys.ts
```

---

## 17. TypeScript Interfaces

### 17.1 Auth Types (`types/auth.types.ts`)

```typescript
export interface Tenant {
  id: number;
  name: string;
  company_name: string;
  rfc: string;
  status: 'active' | 'suspended' | 'cancelled';
  giro: 'servicios' | 'comercio' | 'manufactura' | 'mixto' | null;
  regimen_fiscal: 'resico_pf' | 'pfae' | 'honorarios' | 'resico_pm' | null;
  onboarding_completed: boolean;
  onboarding_step: number;
}

export interface User {
  id: number;
  name: string;
  email: string;
  tenant_id: number;
  tenant?: Tenant;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
  company_name: string;
  rfc: string;
}

export interface AuthResponse {
  token: string;
  user: User;
  tenant: Tenant;
}
```

### 17.2 Dashboard Types (`types/dashboard.types.ts`)

```typescript
export interface MonthPoint {
  mes: string;
  utilidad: number;
  ventas: number;
  gastos: number;
}

export interface CategoryExpense {
  category: string;
  total: number;
  porcentaje: number;
}

export interface InvoiceRow {
  uuid: string;
  emisor_nombre: string;
  total: number;
  fecha_emision: string;
  status: string;
}

export interface DashboardBusinessData {
  periodo: { inicio: string; fin: string };
  utilidad_real: number;
  ventas_mes: number;
  gastos_deducibles_mes: number;
  gastos_sin_factura_mes: number;
  utilidad_mes_anterior: number;
  variacion_porcentaje: number;
  grafica_6_meses: MonthPoint[];
  top_5_categorias_gasto: CategoryExpense[];
  ultimas_5_facturas_recibidas: InvoiceRow[];
  pendientes_revision_count: number;
  insights: string[];
}

export interface DashboardResponse<T> {
  data: T;
}
```

### 17.3 Chat Types (`types/chat.types.ts`)

```typescript
export interface ChatConversation {
  id: number;
  title: string | null;
  status: 'active' | 'archived';
  created_at: string;
  updated_at: string;
}

export interface ToolCall {
  name: string;
  args: Record<string, any>;
}

export interface ChatMessage {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  tool_calls: ToolCall[] | null;
  was_hallucinated: boolean;
  created_at: string;
}

export type SseEventType = 'start' | 'token' | 'tool_call' | 'tool_result' | 'warning' | 'done' | 'error';

export interface SseEvent<T = any> {
  type: SseEventType;
  data: T;
}

export interface SseDoneData {
  conversation_id: number;
  message_id: number;
  content: string;
  was_hallucinated: boolean;
  tokens_input: number;
  tokens_output: number;
}

export interface ConversationsResponse {
  data: ChatConversation[];
  current_page: number;
  last_page: number;
  total: number;
}

export interface ConversationDetailResponse {
  data: ChatConversation;
  messages: ChatMessage[];
}
```

### 17.4 CFDI Types (`types/cfdi.types.ts`)

```typescript
export interface SatCfdi {
  id: number;
  uuid: string;
  tipo_comprobante: 'emitidos' | 'recibidos';
  rfc_emisor: string;
  nombre_emisor: string;
  rfc_receptor: string;
  nombre_receptor: string;
  fecha_emision: string;
  tipo_de_comprobante: string;
  subtotal: number;
  total: number;
  moneda: string;
  estado: string | null;
  category: ExpenseCategory | null;
  vendor: Vendor | null;
  review_status: 'none' | 'pending' | 'confirmed';
  created_at: string;
}

export interface ExpenseCategory {
  id: number;
  name: string;
  slug: string;
  group: string | null;
  nature: string | null;
  icon: string;
  color: string;
}

export interface Vendor {
  id: number;
  rfc: string;
  nombre: string;
  total_pagado: number;
  num_facturas: number;
  is_cost_of_sales: boolean;
}
```

### 17.5 Customer Types (`types/customer.types.ts`)

```typescript
export interface Customer {
  id: number;
  rfc: string;
  nombre_razon_social: string;
  email: string | null;
  telefono: string | null;
  uso_cfdi_default: string | null;
  regimen_fiscal: string | null;
  codigo_postal: string | null;
  direccion_fiscal: Record<string, any> | null;
  notes: string | null;
  created_at: string;
}

export interface CreateCustomerRequest {
  rfc: string;
  nombre_razon_social: string;
  email?: string;
  telefono?: string;
  uso_cfdi_default?: string;
  regimen_fiscal?: string;
  codigo_postal?: string;
  direccion_fiscal?: Record<string, any>;
  notes?: string;
}
```

### 17.6 Product Types (`types/product.types.ts`)

```typescript
export interface Product {
  id: number;
  descripcion: string;
  clave_prod_serv_sat: string;
  unidad_sat: string | null;
  precio_unitario: number;
  iva_aplicable: boolean;
  veces_usado: number;
  created_at: string;
}

export interface CreateProductRequest {
  descripcion: string;
  clave_prod_serv_sat: string;
  unidad_sat?: string;
  precio_unitario?: number;
  iva_aplicable?: boolean;
}
```

### 17.7 Quotation Types (`types/quotation.types.ts`)

```typescript
export interface Quotation {
  id: number;
  customer_id: number;
  customer: Customer;
  folio: string;
  status: 'borrador' | 'enviada' | 'vendida' | 'facturada' | 'cancelada';
  subtotal: number;
  iva: number;
  total: number;
  mensaje_cliente: string | null;
  public_token: string;
  valid_until: string | null;
  items: QuotationItem[];
  created_at: string;
}

export interface QuotationItem {
  id: number;
  product_id: number | null;
  descripcion: string;
  cantidad: number;
  precio_unitario: number;
  descuento: number;
  importe: number;
  iva: number;
  total: number;
  clave_prod_serv_sat: string | null;
  unidad_sat: string | null;
  orden: number;
}

export interface CreateQuotationRequest {
  customer_id: number;
  items: CreateQuotationItemRequest[];
  mensaje_cliente?: string;
  valid_until?: string;
}

export interface CreateQuotationItemRequest {
  product_id?: number;
  descripcion: string;
  cantidad: number;
  precio_unitario: number;
  descuento?: number;
  clave_prod_serv_sat?: string;
  unidad_sat?: string;
  iva_aplicable?: boolean;
}
```

### 17.8 Ticket Types (`types/ticket.types.ts`)

```typescript
export interface TicketExpense {
  id: number;
  ticket_image: TicketImage;
  vendor: Vendor | null;
  rfc_emisor: string | null;
  nombre_emisor: string;
  fecha_ticket: string | null;
  subtotal: number;
  iva: number;
  total: number;
  descripcion: string | null;
  bucket: 'empresa_deducible' | 'empresa_no_deducible' | 'personal';
  expense_category: ExpenseCategory | null;
  has_invoice: boolean;
  linked_cfdi: SatCfdi | null;
  confidence: number;
  review_status: 'none' | 'pending' | 'confirmed';
  notes: string | null;
  created_at: string;
}

export interface TicketImage {
  id: number;
  file_path: string;
  file_size: number;
  mime_type: string;
  created_at: string;
}

export interface UpdateTicketRequest {
  bucket?: 'empresa_deducible' | 'empresa_no_deducible' | 'personal';
  expense_category_id?: number;
  notes?: string;
  subtotal?: number;
  iva?: number;
  total?: number;
  fecha_ticket?: string;
  nombre_emisor?: string;
  rfc_emisor?: string;
}

export interface ConfirmTicketRequest {
  bucket: 'empresa_deducible' | 'empresa_no_deducible' | 'personal';
  expense_category_id?: number;
  notes?: string;
}
```

### 17.9 Notification Types (`types/notification.types.ts`)

```typescript
export interface Notification {
  id: number;
  type: string;
  title: string;
  body: string;
  data: Record<string, any> | null;
  read_at: string | null;
  created_at: string;
}
```

### 17.10 Onboarding Types (`types/onboarding.types.ts`)

```typescript
export interface BusinessInfoRequest {
  business_description?: string;
  giro?: 'servicios' | 'comercio' | 'manufactura' | 'mixto';
  regimen_fiscal?: 'resico_pf' | 'pfae' | 'honorarios' | 'resico_pm';
}

export interface SatStatusResponse {
  status: 'idle' | 'processing' | 'completed' | 'error';
  processing_count: number;
  total_estimated: number;
}
```

---

## 18. Navigation Architecture

### 18.1 Root Layout (`app/_layout.tsx`)

```typescript
import { Stack } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from '@/lib/auth-store';

const queryClient = new QueryClient();

export default function RootLayout() {
  const { isAuth, tenant } = useAuthStore();
  
  return (
    <QueryClientProvider client={queryClient}>
      <Stack>
        {!isAuth ? (
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        ) : !tenant?.onboarding_completed ? (
          <Stack.Screen name="(onboarding)" options={{ headerShown: false }} />
        ) : (
          <Stack.Screen name="(app)" options={{ headerShown: false }} />
        )}
      </Stack>
    </QueryClientProvider>
  );
}
```

### 18.2 App Layout with Tabs + Drawer (`app/(app)/_layout.tsx`)

```typescript
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function AppLayout() {
  return (
    <Tabs screenOptions={{ tabBarActiveTintColor: '#6366f1' }}>
      <Tabs.Screen name="index" options={{
        title: 'Dashboard',
        tabBarIcon: ({ color, size }) => <Ionicons name="home" size={size} color={color} />,
      }} />
      <Tabs.Screen name="chat" options={{
        title: 'Chat',
        tabBarIcon: ({ color, size }) => <Ionicons name="chatbubbles" size={size} color={color} />,
      }} />
      <Tabs.Screen name="tickets" options={{
        title: 'Tickets',
        tabBarIcon: ({ color, size }) => <Ionicons name="receipt" size={size} color={color} />,
      }} />
      <Tabs.Screen name="quotations" options={{ href: null }} />
      <Tabs.Screen name="customers" options={{ href: null }} />
      <Tabs.Screen name="products" options={{ href: null }} />
      <Tabs.Screen name="vendors" options={{ href: null }} />
      <Tabs.Screen name="cfdis" options={{ href: null }} />
      <Tabs.Screen name="notifications" options={{ href: null }} />
      <Tabs.Screen name="settings" options={{ href: null }} />
    </Tabs>
  );
}
```

### 18.3 Navigation Flow

```
Root
├── (auth) — unauthenticated
│   ├── login
│   └── register
├── (onboarding) — onboarding incomplete
│   ├── business-info
│   ├── sat-connect
│   ├── sat-status
│   └── complete
└── (app) — fully authenticated
    └── Tabs
        ├── Dashboard (home)
        ├── Chat
        ├── Tickets
        └── Drawer (via header menu)
            ├── Cotizaciones
            ├── Clientes
            ├── Productos
            ├── Proveedores
            ├── CFDIs
            ├── Notificaciones
            └── Configuración
```

---

## 19. State Management

### 19.1 Auth Store (`lib/auth-store.ts`)

```typescript
import { create } from 'zustand';
import { secureStorage } from './secure-storage';
import { User, Tenant } from '@/types/auth.types';

interface AuthState {
  token: string | null;
  user: User | null;
  tenant: Tenant | null;
  isAuth: boolean;
  setAuth: (token: string, user: User, tenant: Tenant) => Promise<void>;
  updateTenant: (tenant: Tenant) => Promise<void>;
  clear: () => Promise<void>;
  loadFromStorage: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  user: null,
  tenant: null,
  isAuth: false,
  
  setAuth: async (token, user, tenant) => {
    await secureStorage.setItem('prisma_token', token);
    await secureStorage.setItem('prisma_user', JSON.stringify(user));
    await secureStorage.setItem('prisma_tenant', JSON.stringify(tenant));
    set({ token, user, tenant, isAuth: true });
  },
  
  updateTenant: async (tenant) => {
    await secureStorage.setItem('prisma_tenant', JSON.stringify(tenant));
    set((state) => ({ tenant, user: state.user ? { ...state.user, tenant } : null }));
  },
  
  clear: async () => {
    await secureStorage.deleteItem('prisma_token');
    await secureStorage.deleteItem('prisma_user');
    await secureStorage.deleteItem('prisma_tenant');
    set({ token: null, user: null, tenant: null, isAuth: false });
  },
  
  loadFromStorage: async () => {
    const token = await secureStorage.getItem('prisma_token');
    const userJson = await secureStorage.getItem('prisma_user');
    const tenantJson = await secureStorage.getItem('prisma_tenant');
    if (token && userJson && tenantJson) {
      set({ token, user: JSON.parse(userJson), tenant: JSON.parse(tenantJson), isAuth: true });
    }
  },
}));
```

### 19.2 Secure Storage (`lib/secure-storage.ts`)

```typescript
import * as SecureStore from 'expo-secure-store';

export const secureStorage = {
  getItem: async (key: string) => SecureStore.getItemAsync(key),
  setItem: async (key: string, value: string) => SecureStore.setItemAsync(key, value),
  deleteItem: async (key: string) => SecureStore.deleteItemAsync(key),
};
```

### 19.3 Chat Store

```typescript
import { create } from 'zustand';
import { ChatConversation, ChatMessage } from '@/types/chat.types';

interface ChatState {
  conversations: ChatConversation[];
  activeConversation: ChatConversation | null;
  messages: ChatMessage[];
  isStreaming: boolean;
  streamingText: string;
  setConversations: (conversations: ChatConversation[]) => void;
  setActiveConversation: (conversation: ChatConversation | null) => void;
  setMessages: (messages: ChatMessage[]) => void;
  addMessage: (message: ChatMessage) => void;
  setStreaming: (isStreaming: boolean) => void;
  appendStreamingText: (text: string) => void;
  clearStreamingText: () => void;
}

export const useChatStore = create<ChatState>((set) => ({
  conversations: [],
  activeConversation: null,
  messages: [],
  isStreaming: false,
  streamingText: '',
  setConversations: (conversations) => set({ conversations }),
  setActiveConversation: (conversation) => set({ activeConversation: conversation }),
  setMessages: (messages) => set({ messages }),
  addMessage: (message) => set((state) => ({ messages: [...state.messages, message] })),
  setStreaming: (isStreaming) => set({ isStreaming }),
  appendStreamingText: (text) => set((state) => ({ streamingText: state.streamingText + text })),
  clearStreamingText: () => set({ streamingText: '' }),
}));
```

### 19.4 TanStack Query Hooks

**use-auth.ts:**
```typescript
import { useMutation, useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';
import { LoginRequest, RegisterRequest, AuthResponse } from '@/types/auth.types';

export function useLogin() {
  const { setAuth } = useAuthStore();
  return useMutation({
    mutationFn: async (data: LoginRequest) => {
      const response = await api.post<AuthResponse>('/auth/login', data);
      return response.data;
    },
    onSuccess: (data) => setAuth(data.token, data.user, data.tenant),
  });
}

export function useRegister() {
  const { setAuth } = useAuthStore();
  return useMutation({
    mutationFn: async (data: RegisterRequest) => {
      const response = await api.post<AuthResponse>('/auth/register', data);
      return response.data;
    },
    onSuccess: (data) => setAuth(data.token, data.user, data.tenant),
  });
}

export function useMe() {
  return useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      const response = await api.get<AuthResponse>('/auth/me');
      return response.data;
    },
  });
}
```

**use-dashboard.ts:**
```typescript
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { DashboardBusinessData, DashboardResponse } from '@/types/dashboard.types';

export function useDashboardBusiness(month?: string) {
  return useQuery({
    queryKey: ['dashboard', 'business', month],
    queryFn: async () => {
      const params = month ? { month } : {};
      const response = await api.get<DashboardResponse<DashboardBusinessData>>('/dashboard/business', { params });
      return response.data.data;
    },
  });
}
```

**use-chat.ts:**
```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { ConversationsResponse, ConversationDetailResponse } from '@/types/chat.types';

export function useConversations(page = 1) {
  return useQuery({
    queryKey: ['conversations', page],
    queryFn: async () => {
      const response = await api.get<ConversationsResponse>('/chat/conversations', { params: { page } });
      return response.data;
    },
  });
}

export function useConversation(id: number) {
  return useQuery({
    queryKey: ['conversation', id],
    queryFn: async () => {
      const response = await api.get<ConversationDetailResponse>(`/chat/conversations/${id}`);
      return response.data;
    },
    enabled: !!id,
  });
}

export function useDeleteConversation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/chat/conversations/${id}`);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['conversations'] }),
  });
}
```

---

## 20. Screen Inventory (37 Screens)

### 20.1 Auth (2)
- Login - `(auth)/login.tsx`
- Register - `(auth)/register.tsx`

### 20.2 Onboarding (4)
- Business Info - `(onboarding)/business-info.tsx`
- SAT Connect - `(onboarding)/sat-connect.tsx`
- SAT Status - `(onboarding)/sat-status.tsx`
- Complete - `(onboarding)/complete.tsx`

### 20.3 Dashboard (3)
- Business - `(app)/index.tsx`
- Fiscal - `(app)/dashboard/fiscal.tsx`
- Personal - `(app)/dashboard/personal.tsx`

### 20.4 Chat (2)
- Shell - `(app)/chat/index.tsx`
- Conversation Detail - `(app)/chat/[id].tsx`

### 20.5 Tickets (5)
- List - `(app)/tickets/index.tsx`
- Upload - `(app)/tickets/upload.tsx`
- Detail - `(app)/tickets/[id].tsx`
- Pending Review - `(app)/tickets/review.tsx`
- Link to CFDI - `(app)/tickets/link.tsx`

### 20.6 Quotations (5)
- List - `(app)/quotations/index.tsx`
- Create - `(app)/quotations/create.tsx`
- Detail - `(app)/quotations/[id].tsx`
- PDF - `(app)/quotations/[id]/pdf.tsx`
- Public - `(app)/quotations/public/[token].tsx`

### 20.7 Customers (4)
- List - `(app)/customers/index.tsx`
- Create - `(app)/customers/create.tsx`
- Detail - `(app)/customers/[id].tsx`
- Edit - `(app)/customers/[id]/edit.tsx`

### 20.8 Products (2)
- List - `(app)/products/index.tsx`
- Create - `(app)/products/create.tsx`

### 20.9 Vendors (2)
- List - `(app)/vendors/index.tsx`
- Detail - `(app)/vendors/[id].tsx`

### 20.10 CFDIs (4)
- List - `(app)/cfdis/index.tsx`
- Detail - `(app)/cfdis/[id].tsx`
- Pending Review - `(app)/cfdis/review.tsx`
- PDF - `(app)/cfdis/[id]/pdf.tsx`

### 20.11 Notifications (1)
- List - `(app)/notifications.tsx`

### 20.12 Settings (3)
- Menu - `(app)/settings/index.tsx`
- Profile - `(app)/settings/profile.tsx`
- SAT Credentials - `(app)/settings/sat-credentials.tsx`

---

## 21. Design Tokens

### 21.1 Colors (`constants/colors.ts`)

```typescript
export const colors = {
  primary: { DEFAULT: '#6366f1', dark: '#4f46e5', hover: '#4338ca', light: '#e0e7ff' },
  sidebar: '#0f1117',
  page: '#f8fafc',
  card: '#ffffff',
  text: { primary: '#1e293b', secondary: '#334155', muted: '#64748b', placeholder: '#94a3b8', inverse: '#ffffff' },
  border: '#e2e8f0',
  danger: { DEFAULT: '#ef4444', light: '#f87171', bg: '#fef2f2' },
  warning: { DEFAULT: '#fbbf24', bg: '#fef3c7', text: '#92400e' },
  success: { DEFAULT: '#10b981', bg: '#d1fae5' },
  code: { bg: '#1e293b', text: '#d6336c' },
};
```

### 21.2 Typography

```typescript
export const typography = {
  fontFamily: { sans: 'Inter', mono: 'monospace' },
  fontSize: { xs: 12, sm: 14, base: 16, lg: 18, xl: 20, '2xl': 24, '3xl': 30 },
  fontWeight: { normal: '400', medium: '500', semibold: '600', bold: '700' },
};
```

### 21.3 Spacing

```typescript
export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, '2xl': 48 };
```

---

## 22. External Integrations

### 22.1 Camera (`components/tickets/ImagePicker.tsx`)

```typescript
import * as ImagePicker from 'expo-image-picker';

export async function pickImage() {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    quality: 1,
  });
  return result.canceled ? null : result.assets[0];
}

export async function takePhoto() {
  const result = await ImagePicker.launchCameraAsync({
    allowsEditing: true,
    quality: 1,
  });
  return result.canceled ? null : result.assets[0];
}
```

### 22.2 Voice Input (`components/chat/VoiceInput.tsx`)

```typescript
import Voice from '@react-native-voice/voice';
import { useState, useEffect } from 'react';

export function useVoiceInput() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  
  useEffect(() => {
    Voice.onSpeechStart = () => setIsListening(true);
    Voice.onSpeechEnd = () => setIsListening(false);
    Voice.onSpeechResults = (e) => { if (e.value) setTranscript(e.value[0]); };
    return () => { Voice.destroy().then(Voice.removeAllListeners); };
  }, []);
  
  const startListening = async () => { await Voice.start('es-MX'); };
  const stopListening = async () => { await Voice.stop(); };
  
  return { isListening, transcript, startListening, stopListening };
}
```

### 22.3 SSE Streaming (`lib/sse.ts`)

```typescript
import { ENV } from './env';
import { useAuthStore } from './auth-store';

export async function sendChatStream(
  conversationId: number | null,
  message: string,
  onToken: (delta: string) => void,
  onToolCall: (name: string, args: any) => void,
  onToolResult: (result: any) => void,
  onWarning: (message: string) => void,
  onDone: (data: any) => void,
  onError: (error: string) => void,
  signal?: AbortSignal
) {
  const token = useAuthStore.getState().token;
  
  const response = await fetch(`${ENV.API_URL}/chat/send?stream=1`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ conversation_id: conversationId, message }),
    signal,
  });
  
  if (!response.ok) { onError(`HTTP ${response.status}`); return; }
  
  const reader = response.body?.getReader();
  if (!reader) { onError('No response body'); return; }
  
  const decoder = new TextDecoder();
  let buffer = '';
  
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';
    
    for (const line of lines) {
      if (line.startsWith('data:')) {
        const data = line.slice(5).trim();
        if (!data) continue;
        try {
          const parsed = JSON.parse(data);
          switch (parsed.type) {
            case 'token': onToken(parsed.data.delta); break;
            case 'tool_call': onToolCall(parsed.data.name, parsed.data.args); break;
            case 'tool_result': onToolResult(parsed.data); break;
            case 'warning': onWarning(parsed.data.message); break;
            case 'done': onDone(parsed.data); break;
            case 'error': onError(parsed.data.message); break;
          }
        } catch (e) { console.error('SSE parse error:', e); }
      }
    }
  }
}
```

### 22.4 Markdown Rendering (`components/chat/Markdown.tsx`)

```typescript
import Markdown from 'react-native-markdown-display';

export function MarkdownText({ content }: { content: string }) {
  return (
    <Markdown style={{
      body: { color: '#1e293b', fontSize: 16 },
      heading1: { fontSize: 24, fontWeight: 'bold' },
      heading2: { fontSize: 20, fontWeight: 'bold' },
      code: { backgroundColor: '#1e293b', color: '#d6336c', padding: 4 },
      fence: { backgroundColor: '#1e293b', padding: 12 },
    }}>
      {content}
    </Markdown>
  );
}
```

---

## 23. Cheat Sheets

### 23.1 Laravel → Django

| Laravel | Django |
|---------|--------|
| `Model::create()` | `Model.objects.create()` |
| `Model::find($id)` | `Model.objects.get(id=id)` |
| `Model::where()` | `Model.objects.filter()` |
| `Model::first()` | `Model.objects.first()` |
| `$model->save()` | `model.save()` |
| `$model->delete()` | `model.delete()` |
| `Model::with('relation')` | `Model.objects.select_related('relation')` |
| `SoftDeletes` trait | Custom `deleted_at` field + manager |
| `BelongsToTenant` trait | `TenantMixin` + `TenantManager` |
| `HasApiTokens` (Sanctum) | `JWTAuthentication` (simplejwt) |
| Form Request | DRF Serializer with `validate()` |
| API Resource | DRF Serializer |
| Controller | DRF APIView or @api_view |
| Route::apiResource() | DRF DefaultRouter |
| Observer | Signal receiver (@receiver) |
| Job | Celery task (@shared_task) |
| `transaction()` | `transaction.atomic()` |
| `dispatch()` | `.delay()` or `.apply_async()` |
| `Storage::disk()` | `default_storage` |
| `config()` | `settings.VAR` or `config('VAR')` |
| `Carbon` | `django.utils.timezone.now()` |
| `php artisan` | `python manage.py` |
| `php artisan migrate` | `python manage.py migrate` |
| `php artisan tinker` | `python manage.py shell` |
| `php artisan serve` | `python manage.py runserver` |
| `composer.json` | `requirements.txt` |
| `.env` | `.env` (python-decouple) |

### 23.2 Angular → React Native

| Angular | React Native |
|---------|--------------|
| `@Component` | Function component |
| `@Input()` | Props |
| `@Output()` | Callback props |
| `ngOnInit()` | `useEffect(() => {}, [])` |
| `signal<T>()` | `useState<T>()` |
| `computed<T>()` | `useMemo<T>()` |
| `effect()` | `useEffect()` |
| `Injectable` service | Custom hook |
| `HttpClient` | `fetch` or `axios` |
| `Observable<T>` | `Promise<T>` |
| `.subscribe()` | `await` or `.then()` |
| `AsyncPipe` | TanStack Query `useQuery()` |
| `Router.navigate()` | `navigation.navigate()` (@react-navigation) |
| `ActivatedRoute` | `useLocalSearchParams()` |
| `FormsModule` | `react-hook-form` |
| `*ngIf` | `{condition && <Component />}` |
| `*ngFor` | `.map()` |
| `localStorage` | `react-native-keychain` |
| `PrimeNG` | NativeWind + custom components |
| `Web Speech API` | `@react-native-voice/voice` |
| `Karma/Jasmine` | Jest + React Native Testing Library |
| `ng test` | `npm test` or `jest` |
| `ng build` | `npx react-native build` |
| `ng serve` | `npx react-native start` |
| `angular.json` | `react-native.config.js` |
| `app.routes.ts` | `app/` directory structure |
| `core/` | `lib/` + `hooks/` |
| `features/` | `app/` + `hooks/` + `components/` |
| `shared/` | `components/` |
| `OnPush` | `React.memo()` |

---

## 24. Summary

**Backend (Django):**
- 18 models
- 65 API endpoints
- 24 services
- 2 Celery tasks
- 1 signal

**Frontend (React Native):**
- 37 screens
- 65+ API hooks
- 10 TypeScript interface files
- 3 Zustand stores
- TanStack Query for server state

---

This document provides everything needed to build both the Django backend and React Native mobile app from scratch.
