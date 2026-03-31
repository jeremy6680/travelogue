# Travelogue

A full-stack travel blog with an interactive world map and travel timeline. Built as a pnpm monorepo.

## Stack

- **Frontend** — React + Vite + Tailwind CSS (`artifacts/travel-blog`)
- **API** — Express 5 (`artifacts/api-server`)
- **Database** — PostgreSQL + Drizzle ORM (`lib/db`)
- **Shared libs** — OpenAPI spec, generated Zod schemas, generated React Query hooks (`lib/`)

---

## Prerequisites

- Node.js 24
- pnpm 10
- A running PostgreSQL instance

---

## First-time setup

```sh
# Install all dependencies
pnpm install

# Copy and fill in environment variables
cp .env.example .env   # then edit DATABASE_URL
```

The `.env` at the workspace root is shared by both the API server and the scripts:

```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/travelogue
```

### Push the database schema

```sh
pnpm --filter @workspace/db run push
```

This creates the `countries` and `posts` tables via Drizzle's schema push (no migration files needed in development).

### Seed the database

```sh
pnpm --filter @workspace/scripts seed
```

Inserts the demo countries and posts from `scripts/data/`.

---

## Running locally

Each service runs in its own terminal.

### API server — http://localhost:3000

```sh
PORT=3000 pnpm --filter @workspace/api-server dev
```

The `dev` script builds with esbuild then starts the Node.js server. Rebuild and restart on every change.

### Frontend — http://localhost:5173

```sh
pnpm --filter @workspace/travel-blog dev
```

Vite dev server with HMR. The frontend expects the API to be running at `http://localhost:3000`.

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

---

## Monorepo structure

```
travelogue/
├── artifacts/
│   ├── api-server/         # Express API — PORT env var required
│   └── travel-blog/        # React + Vite frontend — PORT defaults to 5173
├── lib/
│   ├── db/                 # Drizzle schema + DB connection
│   ├── api-spec/           # OpenAPI spec (source of truth)
│   ├── api-zod/            # Generated Zod validators (used by api-server)
│   └── api-client-react/   # Generated React Query hooks (used by travel-blog)
├── scripts/
│   ├── data/               # Seed data (countries.json, posts.json)
│   └── src/seed.ts         # DB seed script
└── .env                    # DATABASE_URL (gitignored)
```

### Regenerating API code

If you update `lib/api-spec/openapi.yaml`, regenerate the Zod schemas and React Query hooks:

```sh
pnpm --filter @workspace/api-spec run codegen
```
