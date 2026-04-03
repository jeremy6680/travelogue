# Travelogue

A full-stack travel blog with an interactive world map and travel timeline. Built as a pnpm monorepo.

## Stack

- **Frontend** — React + Vite + Tailwind CSS (`artifacts/travel-blog`)
- **API** — Express 5 (`artifacts/api-server`)
- **CMS** — Directus 11 headless CMS (`artifacts/directus`) — http://localhost:8055
- **Database** — PostgreSQL + Drizzle ORM (`lib/db`)
- **Shared libs** — OpenAPI spec, generated Zod schemas, generated React Query hooks (`lib/`)

---

## Prerequisites

- Node.js 24 (Node.js 20 inside `artifacts/directus` — see its `.nvmrc`)
- pnpm 10
- A running PostgreSQL instance

---

## First-time setup

```sh
# Install all dependencies
pnpm install
```

### 1. Root environment variables

```sh
cp .env.example .env
cp .env.local.example .env.local
```

Le plus simple est d'utiliser cette convention :

- `.env.local` pour ton poste de dev
- `.env.production` comme fichier de référence local uniquement
- les vraies variables de prod directement dans ton hébergeur

Pour le local, mets ta base de dev dans `.env.local` :

```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/travelogue
```

### 2. Directus environment variables

Directus reads its own `.env` at `artifacts/directus/.env`. Create it by copying the example:

```sh
cp artifacts/directus/.env.example artifacts/directus/.env
```

Then open `artifacts/directus/.env` and set at minimum:

```
SECRET=<random 32-char hex string>   # node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
ADMIN_EMAIL=admin@travelogue.local
ADMIN_PASSWORD=<strong password>
```

The database connection in that file defaults to `localhost:5432/travelogue` (same Postgres instance as the API).

### 3. Run database migrations

```sh
pnpm run db:migrate:local
```

This applies all pending SQL migrations from `lib/db/migrations/` to the database. The migration history is tracked in a `__drizzle_migrations` table — already-applied migrations are skipped automatically.

When you update the schema, generate a new migration file first:

```sh
pnpm --filter @workspace/db generate
# review the generated .sql file in lib/db/migrations/
pnpm --filter @workspace/db migrate
```

> **Note:** In production the API server runs migrations automatically on startup.

### 4. Bootstrap Directus (first run only)

```sh
pnpm --filter @workspace/directus run bootstrap
```

This initialises the Directus system tables in the database and creates the admin account defined in `artifacts/directus/.env`. Only needs to run once.

### 5. Seed the database

```sh
pnpm run db:seed:local
```

Inserts the demo trips and posts from `scripts/data/`.

Tu peux aussi faire les deux d'un coup :

```sh
pnpm run db:setup:local
```

### Local vs production

Commandes locales :

```sh
pnpm run db:migrate:local
pnpm run db:seed:local
```

Commande production depuis ta machine, seulement si `.env.production` existe et pointe bien vers la bonne base :

```sh
pnpm run db:migrate:prod
```

N'utilise pas `db:seed:prod` sauf si tu veux volontairement injecter les données de démo dans la base de production.

---

## Running locally

Each service runs in its own terminal.

### API server — http://localhost:3000

```sh
PORT=3000 pnpm --filter @workspace/api-server dev
```

The `dev` script builds with esbuild then starts the Node.js server. Rebuild and restart on every change.

### Directus CMS — http://localhost:8055

```sh
pnpm --filter @workspace/directus dev
```

Directus admin UI is at **http://localhost:8055/admin**. Log in with the credentials from `artifacts/directus/.env`.

### Frontend — http://localhost:5173

```sh
pnpm --filter @workspace/travel-blog dev
```

Vite dev server with HMR. The frontend expects the API to be running at `http://localhost:3000`.

If you want the frontend to target a different API base URL, set:

```sh
VITE_API_BASE_URL=https://api.example.com
```

---

## Viewing the database

[Drizzle Studio](https://local.drizzle.studio) is a browser-based UI to browse and edit tables:

```sh
pnpm --filter @workspace/db exec drizzle-kit studio --config ./drizzle.config.ts
```

Then open **https://local.drizzle.studio** in your browser.

---

## Typechecking

```sh
# Typecheck everything (libs + artifacts + scripts)
pnpm run typecheck

# Typecheck a single package
pnpm --filter @workspace/api-server run typecheck
pnpm --filter @workspace/travel-blog run typecheck
```

## Building for production

```sh
pnpm run build
```

Runs `typecheck` first, then `build` in every package that has one. Frontend output goes to `artifacts/travel-blog/dist/public/`.

## Production Deployment

### Recommended topology

- `travelogue.jeremymarchandeau.com` → frontend (`artifacts/travel-blog`) on Netlify
- `api.travelogue.jeremymarchandeau.com` → API (`artifacts/api-server`) on Coolify
- PostgreSQL → private service on Coolify
- Directus → optional, only if you want the CMS in production

### API on Coolify

The repo includes a production Dockerfile for the API at [artifacts/api-server/Dockerfile](/Users/jeremymarchandeau/Code/personal/projects/travelogue/artifacts/api-server/Dockerfile).

Suggested Coolify settings:

- Build pack: `Dockerfile`
- Dockerfile path: `artifacts/api-server/Dockerfile`
- Build context: repository root
- Exposed port: `3000`

Required environment variables for the API service:

```sh
PORT=3000
DATABASE_URL=postgresql://<user>:<password>@<postgres-host>:5432/travelogue
CORS_ORIGIN=https://travelogue.jeremymarchandeau.com
ADMIN_API_TOKEN=<long-random-secret>
```

The API runs database migrations automatically on startup.

Health check endpoint:

```txt
/api/healthz
```

### Frontend on Netlify

Set this environment variable in Netlify for the frontend site:

```sh
VITE_API_BASE_URL=https://api.travelogue.jeremymarchandeau.com
```

Then redeploy the frontend.

### Protecting `/admin`

The `/admin` page is part of the frontend app, not the API. By default, anyone who knows the URL can open it unless you protect it at the edge.

Recommended setup:

1. Protect `https://travelogue.jeremymarchandeau.com/admin*` with Cloudflare Access
2. Limit access to your email address only
3. Keep the admin link hidden in the public UI by default

The footer admin link is hidden unless this Netlify environment variable is enabled:

```sh
VITE_SHOW_ADMIN_LINK=true
```

Suggested Cloudflare Access policy:

- Application type: Self-hosted
- Domain / destination: `travelogue.jeremymarchandeau.com/admin*`
- Policy action: Allow
- Include rule: your email address only

Important: protecting `/admin` is not enough on its own. The API write routes should also be protected so nobody can call them directly without authorization.

This repo now protects all API write routes (`POST`, `PATCH`, `DELETE` on posts, trips, photos) with a bearer token.

How it works:

- Set `ADMIN_API_TOKEN` on the API service
- Open `/admin`
- Enter the token once per browser session
- The frontend sends `Authorization: Bearer <token>` on admin write requests

### PostgreSQL on Coolify

- Create a Postgres service
- Create a database named `travelogue`
- Copy the internal connection string into `DATABASE_URL` for the API service
- Do not expose Postgres publicly unless you have a specific reason

### Directus on Coolify

Directus is optional. Deploy it only if you want a production CMS/admin separate from the custom Travelogue admin.

If you deploy it:

- Give it the same Postgres instance (or a separate one if you prefer)
- Set `PUBLIC_URL`
- Persist the uploads directory
- Restrict access to the admin domain if needed

---

## Monorepo structure

```
travelogue/
├── artifacts/
│   ├── api-server/         # Express API — PORT env var required
│   ├── directus/           # Directus CMS — runs on port 8055, own .env
│   └── travel-blog/        # React + Vite frontend — PORT defaults to 5173
├── lib/
│   ├── db/
│   │   ├── migrations/     # Versioned SQL migration files (committed to git)
│   │   └── src/
│   │       ├── schema/     # Drizzle table definitions (source of truth)
│   │       └── migrate.ts  # Programmatic migration runner (called at server startup)
│   ├── api-spec/           # OpenAPI spec (source of truth for API shape)
│   ├── api-zod/            # Generated Zod validators (used by api-server)
│   └── api-client-react/   # Generated React Query hooks (used by travel-blog)
├── scripts/
│   ├── data/               # Seed data (trips.json, posts.json)
│   └── src/seed.ts         # DB seed script
└── .env                    # DATABASE_URL (gitignored)
```

### Regenerating API code

If you update `lib/api-spec/openapi.yaml`, regenerate the Zod schemas and React Query hooks:

```sh
pnpm --filter @workspace/api-spec run codegen
```
