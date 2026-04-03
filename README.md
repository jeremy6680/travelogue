# Travelogue

Travelogue is a pnpm monorepo for a travel blog frontend backed by Directus and PostgreSQL.

## Stack

- Frontend: React, Vite, Tailwind (`artifacts/travel-blog`)
- CMS: Directus 11 (`artifacts/directus`)
- Database: PostgreSQL + Drizzle (`lib/db`)
- Scripts: migrations and seeders from the workspace root

## Documentation

- Directus operations guide: [`docs/directus.md`](/Users/jeremymarchandeau/Code/personal/projects/travelogue/docs/directus.md)
- Directus deployment on Coolify: [`docs/directus-coolify.md`](/Users/jeremymarchandeau/Code/personal/projects/travelogue/docs/directus-coolify.md)
- Production checklist: [`docs/production-checklist.md`](/Users/jeremymarchandeau/Code/personal/projects/travelogue/docs/production-checklist.md)

## Prerequisites

- Node.js 24 for the workspace
- Node.js 22 inside `artifacts/directus` if you run Directus in isolation
- pnpm 10
- A running PostgreSQL instance

## Setup

Install dependencies:

```sh
pnpm install
```

Create the root env file:

```sh
cp .env.example .env
```

For local development, the root env only needs a database URL:

```sh
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/travelogue
```

Create the Directus env file:

```sh
cp artifacts/directus/.env.example artifacts/directus/.env
```

At minimum, set these values in `artifacts/directus/.env`:

```sh
SECRET=<random 32-char hex string>
ADMIN_EMAIL=admin@travelogue.local
ADMIN_PASSWORD=<strong password>
```

Create the frontend env file:

```sh
cp artifacts/travel-blog/.env.example artifacts/travel-blog/.env.local
```

Default local frontend config:

```sh
VITE_API_BASE_URL=http://localhost:8055
```

For production, set:

```sh
VITE_API_BASE_URL=https://directus.your-domain.com
```

## Database

Run migrations:

```sh
pnpm run db:migrate:local
```

Seed demo content:

```sh
pnpm run db:seed:local
```

Or do both:

```sh
pnpm run db:setup:local
```

If you change the Drizzle schema, generate and apply a new migration:

```sh
pnpm --filter @workspace/db generate
pnpm --filter @workspace/db migrate
```

## Directus Bootstrap

On the first run only:

```sh
pnpm --filter @workspace/directus bootstrap
```

This initializes Directus system tables and creates the admin account from `artifacts/directus/.env`.

## Run Locally

Start Directus:

```sh
pnpm --filter @workspace/directus dev
```

Directus admin is available at `http://localhost:8055/admin`.

Start the frontend:

```sh
pnpm --filter @workspace/travel-blog dev
```

The frontend runs on `http://localhost:5173` and talks directly to Directus.

## Typecheck and Build

Typecheck the whole repo:

```sh
pnpm run typecheck
```

Typecheck only the frontend:

```sh
pnpm --filter @workspace/travel-blog typecheck
```

Build everything:

```sh
pnpm run build
```

## Deployment Notes

- Netlify should build `@workspace/travel-blog` and publish `artifacts/travel-blog/dist/public`
- Set `VITE_API_BASE_URL` in Netlify to your hosted Directus URL
- Host Directus separately with access to the same PostgreSQL database
- Protect `/admin` at the frontend edge if you expose it publicly

## Repository Layout

```text
artifacts/
  directus/      Directus CMS
  travel-blog/   React frontend
lib/
  db/            Drizzle schema, migrations, and DB tooling
scripts/
  data/          Seed data
```
