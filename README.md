# LLM Lab

Interactive LLM training & customization simulator. Non-technical users walk through a 14-step pipeline — dataset prep, tokenization, architecture, training, fine-tuning, RAG, evaluation, deployment — and watch simulated scores evolve in real time.

## Stack

- **Web** — Next.js 16 (App Router) + next-intl + Tailwind + shadcn/ui + Zustand + Recharts
- **API** — FastAPI + SQLAlchemy 2.0 async + Alembic
- **DB** — Supabase Postgres
- **Auth** — Supabase Auth (JWT)
- **Cache** — Redis

## Quick start

### 1. Create a Supabase project

From [supabase.com/dashboard](https://supabase.com/dashboard) → **New project**.
After it provisions, grab these from **Settings → API**:

- `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
- `anon` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `service_role` key → `SUPABASE_SERVICE_ROLE_KEY`
- `JWT Secret` → `JWT_SECRET` *(bottom of the page; required by the API to verify tokens)*

From **Settings → Database → Connection string** copy the URI and prefix it with `postgresql+asyncpg://` for `DATABASE_URL`.

### 2. Configure environment

```bash
cp .env.example .env
# Edit .env with your Supabase values
```

Set `NEXT_PUBLIC_DEMO_MODE=false` once you have a real backend running. Leave it `true` to work on the UI without a backend.

### 3. Install & migrate

```bash
# Root: install all JS deps via pnpm workspaces
pnpm install

# API: install Python deps and run migrations
cd apps/api
uv sync
uv run alembic upgrade head
cd ../..
```

### 4. Run

```bash
# From repo root — Turbo starts both web (:3000) and api (:8000)
pnpm dev
```

Or run individually:

```bash
pnpm --filter web dev         # Next.js
cd apps/api && uv run uvicorn app.main:app --reload
```

### 5. Use

1. Open `http://localhost:3000`
2. Register → Login
3. **New Project** → walk through the 14 steps
4. Scores update live; exit and resume anytime from the dashboard

## Troubleshooting

**API exits immediately with `JWT_SECRET is not configured`**
Set `JWT_SECRET` in `.env` from Supabase Dashboard → Settings → API → JWT Secret. For local UI-only work without auth, set `REQUIRE_AUTH=false`.

**Frontend pages show mock data even though the API is running**
`NEXT_PUBLIC_DEMO_MODE` is `true`. Set it to `false` so API errors bubble up instead of being masked by fallbacks.

**401 on every API call**
`JWT_SECRET` in the API doesn't match the Supabase project's secret. Verify both `NEXT_PUBLIC_SUPABASE_URL` (web) and `JWT_SECRET` (API) come from the same project.

**Alembic migration fails with `asyncpg` not found**
Your `DATABASE_URL` must use the `postgresql+asyncpg://` scheme, not `postgresql://`.

**Redirected to `/login` unexpectedly**
Any path under `/projects` requires an authenticated Supabase session. Register and log in first.

## Project layout

```
apps/
  web/          Next.js frontend (14 step pages + auth + i18n)
  api/          FastAPI backend (simulation engine + CRUD + JWT)
    alembic/    Migrations
    app/
      routers/  Endpoint handlers
      models/   SQLAlchemy ORM
      services/ Simulation logic
```

## Scripts

```bash
pnpm dev              # Turbo: web + api dev
pnpm --filter web lint
pnpm --filter web build
cd apps/api && uv run alembic revision --autogenerate -m "..."
cd apps/api && uv run alembic upgrade head
```
