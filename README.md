# Fintor

Financial SaaS for Mexican PyMEs — CFDI management, expense classification, quotations, and financial dashboards.

## Stack

**Backend** — Django 6.0, Django REST Framework 3.17, PostgreSQL 16, Redis 5, Celery

**Frontend** — React Native, TypeScript, TanStack React Query, Zustand

**Services** — Gemini API (expense classification), SW Sapiens (CFDI/PAC), Cloudflare R2 (file storage)

## Architecture

- Multitenant SaaS — each tenant scoped via `TenantManager` + `EnsureTenantContext` middleware
- JWT auth via `djangorestframework-simplejwt`
- 20 models across 13 apps: accounts, tenants, sat, customers, vendors, products, quotations, tickets, classification, notifications, chat, dashboard, common
- Celery for async tasks (CFDI sync, notifications, classification)

## Quick Start

```bash
# Backend
cp .env.example .env        # edit credentials
docker compose up -d db redis
venv\Scripts\python.exe manage.py migrate
venv\Scripts\python.exe manage.py runserver 0.0.0.0:8000

# Mobile
cd mobile
npx react-native start
```
