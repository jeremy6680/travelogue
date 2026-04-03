# Workspace

## Overview

pnpm monorepo for Travelogue, a travel blog frontend powered by Directus and PostgreSQL.

## Current Architecture

- `artifacts/travel-blog`: React + Vite frontend
- `artifacts/directus`: Directus CMS and admin
- `lib/db`: Drizzle schema, migrations, and database utilities
- `scripts`: seed scripts and helper data

## Notes

- The frontend talks directly to Directus through `@directus/sdk`
- There is no separate custom API server anymore
- Travel content lives in the Directus collections `posts`, `trips`, and `photos`
- Derived data like map pins and travel stats are computed in the frontend data layer

## Common Commands

```sh
pnpm install
pnpm run db:migrate:local
pnpm run db:seed:local
pnpm --filter @workspace/directus bootstrap
pnpm --filter @workspace/directus dev
pnpm --filter @workspace/travel-blog dev
pnpm run typecheck
```
