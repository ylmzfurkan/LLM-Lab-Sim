# Deployment Guide

LLM Lab is a monorepo with two deployable services:

- **`apps/web`** — Next.js 16 (React 19) frontend.
- **`apps/api`** — FastAPI + SQLAlchemy async backend.

Shared dependencies: PostgreSQL (we recommend Supabase), Redis, Supabase Auth (optional — can be disabled).

---

## 1. Environment variables

Copy `.env.example` → `.env` and fill in:

| Variable | Used by | Notes |
|---|---|---|
| `DATABASE_URL` | api | `postgresql+asyncpg://…` — Supabase connection string works as-is. |
| `REDIS_URL` | api | `redis://host:6379/0` |
| `JWT_SECRET` | api | Supabase Dashboard → Settings → API → JWT Secret. Required when `REQUIRE_AUTH=true`. |
| `REQUIRE_AUTH` | api | `true` (default) for production with Supabase; `false` for demo / self-hosted single-tenant. When `false`, all requests resolve to a shared `demo@local` user. |
| `RATE_LIMIT_SIMULATE` | api | Default `60/minute` per IP on `/simulate/*`. |
| `RATE_LIMIT_ENABLED` | api | Set `false` to disable. |
| `API_CORS_ORIGINS` | api | Comma-separated origins allowed to call the API. |
| `NEXT_PUBLIC_SUPABASE_URL` | web | Supabase project URL. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | web | Supabase anon public key. |
| `NEXT_PUBLIC_API_URL` | web | Public URL the browser uses to reach the API. |
| `NEXT_PUBLIC_DEMO_MODE` | web | `true` falls back to mock data when the API is unreachable. Set `false` in prod. |

---

## 2. Local with Docker Compose

```bash
docker-compose up --build
```

Brings up Postgres, Redis, the API (with auto-migration via `alembic upgrade head`), and the web app. Visit http://localhost:3000.

This compose file defaults to `REQUIRE_AUTH=false` for frictionless local demos.

---

## 3. Database migrations (Supabase or self-hosted Postgres)

```bash
cd apps/api
alembic upgrade head
```

Run this once per deploy against your production `DATABASE_URL`. The compose file does this automatically on each `api` container start.

---

## 4. Deployment targets

### A. Vercel (web) + Fly.io/Railway (api) — recommended for demos

**Frontend (Vercel):**
1. Import the repo, set the project root to `apps/web`.
2. Build command: `pnpm --filter web build`. Install command: `pnpm install --frozen-lockfile`.
3. Env vars: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_DEMO_MODE=false`.

**Backend (Fly.io):**
1. `fly launch` in `apps/api` — uses `apps/api/Dockerfile`.
2. `fly secrets set DATABASE_URL=… JWT_SECRET=… REDIS_URL=… API_CORS_ORIGINS=https://your-web.vercel.app`.
3. `fly deploy`.

**Backend (Railway):** Create a service from repo, root = `apps/api`, Dockerfile detected, set the same secrets.

### B. Single VM with docker-compose

Copy the repo to the VM, create a production `.env`, then:

```bash
docker-compose -f docker-compose.yml up -d --build
```

Place Nginx or Caddy in front to terminate TLS. Point `NEXT_PUBLIC_API_URL` to the public API hostname.

### C. Kubernetes

Build and push both images:

```bash
docker build -t registry/llm-lab-api:latest apps/api
docker build -t registry/llm-lab-web:latest -f apps/web/Dockerfile .
```

Deploy with standard Deployment + Service manifests. Use a StatefulSet or managed Postgres (Supabase/RDS) and a managed Redis.

---

## 5. Supabase setup (optional auth)

1. Create a Supabase project.
2. Enable Email + any OAuth providers under Authentication.
3. Copy project URL, anon key, service role key, and JWT secret into env vars.
4. Run migrations against the Supabase Postgres instance.
5. Deploy with `REQUIRE_AUTH=true`.

---

## 6. Scaling notes

- The simulation engine is pure CPU/NumPy — horizontal scale API replicas behind a load balancer.
- Rate limiting uses in-memory storage by default. For multi-replica deployments, switch slowapi to Redis storage in `apps/api/app/rate_limit.py`.
- Postgres is the bottleneck for write-heavy workloads (simulation runs). Indexes on `simulation_runs(project_id, created_at)` exist via Alembic.
- Frontend is fully static-friendly — serve via CDN.

---

## 7. Verification checklist

- [ ] `GET /api/health` returns `{"status":"ok"}`.
- [ ] Web loads at production URL, wizard → dataset → report completes.
- [ ] With `REQUIRE_AUTH=true`, an unauthenticated request to `/api/projects` returns 401.
- [ ] With `REQUIRE_AUTH=false`, the same request succeeds and resolves to the demo user.
- [ ] `alembic upgrade head` is idempotent (run twice, second is no-op).
- [ ] Rate limit: 61st request in a minute returns 429.
