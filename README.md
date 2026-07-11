# Fintor

Financial SaaS for Mexican PyMEs — CFDI, expenses, quotations, dashboards.

| Layer | Stack |
|-------|--------|
| API | Django 6 + DRF + JWT |
| DB / queue | PostgreSQL 16, Redis, Celery |
| Mobile | Expo 54 (React Native) + React Query + Zustand |
| External | Gemini, SW Sapiens (PAC), Cloudflare R2 |

## Prerequisites

- Docker Desktop
- Node 20+
- Expo Go on a phone, or an emulator

## 1. Configure

```bash
cp .env.example .env
# edit DB_*, SECRET_KEY, and any API keys you need
```

## 2. Start backend (API + DB + Redis + Celery)

```bash
docker compose up -d --build
docker compose exec web python manage.py migrate
# optional:
docker compose exec web python manage.py createsuperuser
```

| Service | URL / port |
|---------|------------|
| API | http://localhost:8000 |
| Postgres | localhost:5432 |
| Redis | localhost:6379 |

Stop: `docker compose down`

## 3. Start mobile

```bash
cd mobile
npm install
npm start
```

Then press `a` (Android), `i` (iOS), or scan the QR with Expo Go.

API base URL defaults to `http://localhost:8000/api/v1/` (see `mobile/src/api/client.ts`).  
Physical device: set `extra.apiBaseUrl` in `mobile/app.json` to your machine LAN IP, e.g. `http://192.168.x.x:8000/api/v1/`.

## Useful commands

```bash
docker compose exec web python manage.py migrate
docker compose exec web python manage.py createsuperuser
docker compose logs -f web celery
docker compose restart web
```

Migration blueprint / schema notes: [SETUP.md](SETUP.md).
