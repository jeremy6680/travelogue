# Travelogue Production Checklist

Use this checklist before considering Travelogue production-ready after a schema or deployment change.

## Infrastructure

- Directus is reachable at [cms.travelogue.jeremymarchandeau.com](https://cms.travelogue.jeremymarchandeau.com)
- Frontend is reachable at [travelogue.jeremymarchandeau.com](https://travelogue.jeremymarchandeau.com)
- Directus and PostgreSQL point to the intended production database
- Coolify persistent storage is mounted at `/data/uploads`

## Environment Variables

Directus:

- `PUBLIC_URL=https://cms.travelogue.jeremymarchandeau.com`
- `CORS_ORIGIN=https://travelogue.jeremymarchandeau.com`
- `DB_CLIENT=pg`
- `DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USER`, `DB_PASSWORD` are correct
- `SECRET` is set
- `ADMIN_EMAIL` is set
- `ADMIN_PASSWORD` is set

Frontend:

- `VITE_API_BASE_URL=https://cms.travelogue.jeremymarchandeau.com`

## Directus Health

- `https://cms.travelogue.jeremymarchandeau.com/server/ping` returns `pong`
- Directus admin opens successfully
- the expected collections appear in `Settings` → `Data Model`
- the expected new fields appear in `Data Model`

## Public API Access

- `Public` has `Read` access on `posts`
- `Public` has `Read` access on `trips`
- `Public` has `Read` access on `photos`

Smoke tests:

- `https://cms.travelogue.jeremymarchandeau.com/items/posts?limit=1`
- `https://cms.travelogue.jeremymarchandeau.com/items/trips?limit=1`
- `https://cms.travelogue.jeremymarchandeau.com/items/photos?limit=1`

All should return JSON, not `403`.

## Schema Deployment

- [`artifacts/directus/schema.yaml`](/Users/jeremymarchandeau/Code/personal/projects/travelogue/artifacts/directus/schema.yaml) is committed
- if Directus extensions changed, their `dist` files under [`artifacts/directus/extensions`](/Users/jeremymarchandeau/Code/personal/projects/travelogue/artifacts/directus/extensions) are committed
- schema changes were tested locally first
- if Directus extensions changed, Directus was redeployed before running `schema apply`
- production schema was applied after deploy
- if the admin looked stale after apply, Directus was restarted

## Frontend

- homepage renders real data from Directus
- posts list renders
- trips/timeline/atlas views render
- photos render
- no obvious console or network errors remain

## Security Cleanup

If secrets were exposed in build or deploy logs, rotate them:

- `ADMIN_PASSWORD`
- `SECRET`
- `DB_PASSWORD`

## Documentation

- schema changes are documented in the relevant PR or commit
- Directus workflow is kept in sync with [`docs/directus.md`](/Users/jeremymarchandeau/Code/personal/projects/travelogue/docs/directus.md)
- Coolify deployment notes are kept in sync with [`docs/directus-coolify.md`](/Users/jeremymarchandeau/Code/personal/projects/travelogue/docs/directus-coolify.md)
