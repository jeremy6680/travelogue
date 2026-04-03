# Directus Guide

This project uses Directus from [`artifacts/directus`](/Users/jeremymarchandeau/Code/personal/projects/travelogue/artifacts/directus) on top of the shared PostgreSQL database.

Deployment on Coolify is documented in [`docs/directus-coolify.md`](/Users/jeremymarchandeau/Code/personal/projects/travelogue/docs/directus-coolify.md).

## Where Directus Lives

- Directus app: [`artifacts/directus`](/Users/jeremymarchandeau/Code/personal/projects/travelogue/artifacts/directus)
- Directus env example: [`artifacts/directus/.env.example`](/Users/jeremymarchandeau/Code/personal/projects/travelogue/artifacts/directus/.env.example)
- Coolify env example: [`artifacts/directus/.env.coolify.example`](/Users/jeremymarchandeau/Code/personal/projects/travelogue/artifacts/directus/.env.coolify.example)
- Directus package scripts: [`artifacts/directus/package.json`](/Users/jeremymarchandeau/Code/personal/projects/travelogue/artifacts/directus/package.json)
- Container startup script: [`artifacts/directus/scripts/container-start.mjs`](/Users/jeremymarchandeau/Code/personal/projects/travelogue/artifacts/directus/scripts/container-start.mjs)
- Schema snapshot file: [`artifacts/directus/schema.yaml`](/Users/jeremymarchandeau/Code/personal/projects/travelogue/artifacts/directus/schema.yaml)

## Important Node Version

Use Node 22 inside the Directus app.

The file [`artifacts/directus/.nvmrc`](/Users/jeremymarchandeau/Code/personal/projects/travelogue/artifacts/directus/.nvmrc) contains:

```sh
22
```

Before running Directus commands locally:

```sh
cd /Users/jeremymarchandeau/Code/personal/projects/travelogue/artifacts/directus
nvm use 22
```

If you run Directus with another Node version, Directus may reject the runtime or native modules may fail.

## Environment Files

Local development uses:

```sh
artifacts/directus/.env
```

Optional local reference for production apply uses:

```sh
artifacts/directus/.env.production
```

At minimum, Directus needs database variables plus a `SECRET`.

Example local setup:

```sh
cp artifacts/directus/.env.example artifacts/directus/.env
```

Important variables:

```sh
DB_CLIENT=pg
DB_HOST=localhost
DB_PORT=5432
DB_DATABASE=travelogue
DB_USER=postgres
DB_PASSWORD=postgres
SECRET=replace-with-a-random-32-char-hex-string
ADMIN_EMAIL=admin@travelogue.local
ADMIN_PASSWORD=replace-with-a-strong-password
```

## First-Time Bootstrap

Bootstrap Directus only on the first run of a fresh database:

```sh
cd /Users/jeremymarchandeau/Code/personal/projects/travelogue/artifacts/directus
nvm use 22
pnpm install
pnpm run bootstrap
```

This creates the Directus system tables and the admin account from `.env`.

## Start Directus Locally

```sh
cd /Users/jeremymarchandeau/Code/personal/projects/travelogue/artifacts/directus
nvm use 22
pnpm install
pnpm run dev
```

Default URLs:

- API: `http://localhost:8055`
- Admin: `http://localhost:8055/admin`

## Local Schema Workflow

Use this whenever you add or edit collections, fields, relations, permissions, or policies in Directus.

### 1. Start from Local

1. Start PostgreSQL locally.
2. Start Directus locally.
3. Open `http://localhost:8055/admin`.
4. Make your structural changes in the Directus admin.

### 2. Export the Updated Schema

After your local changes:

```sh
cd /Users/jeremymarchandeau/Code/personal/projects/travelogue/artifacts/directus
nvm use 22
pnpm run schema:snapshot:local
```

This updates:

```sh
artifacts/directus/schema.yaml
```

Important:

- This exports schema only, not content.
- Commit this file whenever the Directus structure changes.

### 3. Review the Snapshot Diff

Before you commit, review the diff carefully.

Things to look for:

- the expected new collection exists
- the expected new field exists
- permissions or policies were not changed accidentally
- field names are spelled exactly as intended
- field types match your expectation

### 4. Update Frontend or Backend Code if Needed

If a new field is used by the app, update the relevant code too.

In this project, Directus reads are defined in:

- [`artifacts/travel-blog/src/lib/directus.ts`](/Users/jeremymarchandeau/Code/personal/projects/travelogue/artifacts/travel-blog/src/lib/directus.ts)

Example:

- if you add a field to `trips`, make sure it is requested in `fetchTrips()`
- if the field needs mapping, update `mapTrip()`

### 5. Test Locally

Before pushing:

1. verify the field exists in the Directus Data Model
2. verify the field appears in the relevant content forms
3. verify the frontend still works locally
4. if the frontend reads the field, verify the API returns it

## Production Schema Workflow

The reliable production flow is:

1. make the structural change locally in Directus
2. export `schema.yaml`
3. commit and push the schema change
4. deploy Directus
5. apply the schema to production
6. restart Directus if the admin UI still shows stale metadata
7. verify the Data Model and API in production

### Apply the Saved Schema to Production

If you want to apply the saved schema from your machine:

```sh
cd /Users/jeremymarchandeau/Code/personal/projects/travelogue/artifacts/directus
nvm use 22
pnpm install
pnpm run schema:apply:prod
```

That uses:

```sh
node --env-file=.env.production ./node_modules/.bin/directus schema apply schema.yaml --yes
```

If you prefer to run it inside the Coolify container:

```sh
cd /app
node ./node_modules/.bin/directus schema apply schema.yaml --yes
```

### Important Production Note

The Coolify container auto-bootstraps and auto-applies `schema.yaml` only on the first start of a fresh database.

That means:

- first deployment to a brand-new DB: schema is applied automatically
- later schema changes: you must run `schema apply` again yourself

### After `schema apply`

Always verify:

1. the new field or collection appears in `Settings` → `Data Model`
2. the field appears in the relevant collection editor
3. the API returns the field when queried
4. the frontend still works

If the field exists in the database but is missing from the admin UI, restart the Directus app in Coolify and reload the admin.

## Public Permissions for the Frontend

The frontend reads Directus without a token for public content.

At minimum, the `Public` policy or role must have `Read` access on:

- `posts`
- `trips`
- `photos`

If the frontend is not loading data, test:

```sh
https://cms.travelogue.jeremymarchandeau.com/server/ping
https://cms.travelogue.jeremymarchandeau.com/items/posts?limit=1
https://cms.travelogue.jeremymarchandeau.com/items/trips?limit=1
https://cms.travelogue.jeremymarchandeau.com/items/photos?limit=1
```

If `server/ping` works but `/items/...` returns `403`, the issue is permissions, not Netlify.

## Changing or Adding a Field

Recommended process:

1. run Directus locally
2. open the local Directus admin
3. add or edit the field in the local collection
4. save the field
5. export the schema with `pnpm run schema:snapshot:local`
6. review and commit [`artifacts/directus/schema.yaml`](/Users/jeremymarchandeau/Code/personal/projects/travelogue/artifacts/directus/schema.yaml)
7. update frontend code if needed
8. push and deploy
9. apply the schema in production
10. verify the field in prod

## Changing or Adding a Collection

Recommended process:

1. run Directus locally
2. create or edit the collection in the local Directus admin
3. add its fields and relations
4. configure permissions or policies if the frontend needs public read access
5. export the schema with `pnpm run schema:snapshot:local`
6. review the diff carefully
7. update frontend code if the app reads this collection
8. push and deploy
9. apply the schema in production
10. verify both the Data Model and API in prod

## Legacy Data and Type-Migration Gotchas

If `schema apply` fails while changing a field type, the most common cause is existing production data that is not compatible with the new target type.

Example that happened in this project:

- `trips.transportation_to` changed to `json`
- production still had plain text values like `Car`
- PostgreSQL failed on `::json`

Typical symptoms:

- `invalid input syntax for type json`
- `schema apply` stops before later fields are created

Recommended response:

1. stop and read the exact failing column in the error
2. normalize the existing DB values manually in PostgreSQL
3. rerun `schema apply`

For comma-separated text moving to JSON arrays, converting values like `Car` or `Train, Bus` to `["Car"]` or `["Train","Bus"]` is usually the safest bridge.

## What Is Not Included in `schema.yaml`

The schema snapshot does not include:

- content items
- uploaded files
- local uploads directory contents
- database backups

If you need content migration, handle that separately.

## Common Errors

### `Database doesn't have Directus tables installed`

Cause:

- Directus is starting against a fresh DB

Fix:

- on Coolify, the container now auto-bootstraps on the first startup of a fresh DB
- locally, run:

```sh
cd /Users/jeremymarchandeau/Code/personal/projects/travelogue/artifacts/directus
nvm use 22
pnpm install
pnpm run bootstrap
```

### `DB_CLIENT Environment Variable is missing`

Cause:

- you ran the command from the wrong directory
- or the env file was not loaded

Fix:

```sh
cd /Users/jeremymarchandeau/Code/personal/projects/travelogue/artifacts/directus
nvm use 22
pnpm run schema:snapshot:local
```

### `ENOENT ... directus/schema.yaml`

Cause:

- wrong output path when already inside `artifacts/directus`

Wrong:

```sh
npx directus schema snapshot ./directus/schema.yaml
```

Correct:

```sh
npx directus schema snapshot schema.yaml
```

### `invalid input syntax for type json`

Cause:

- a field type was migrated to `json`
- the production table still contains incompatible text values

Fix:

1. inspect the failing column in the PostgreSQL error
2. normalize old values to valid JSON text
3. rerun `schema apply`

### Schema Applied Successfully but Field Still Missing in Admin

Cause:

- the DB and `directus_fields` are updated
- the admin UI is still showing stale metadata

Fix:

1. hard refresh the browser
2. try a private window
3. restart the Directus app in Coolify

## Safe Production Checklist

Before applying a schema change to production:

- confirm `schema.yaml` contains the intended change
- confirm the change was tested locally
- confirm the frontend code is compatible with the schema change
- confirm a DB backup exists
- confirm no one is making manual schema changes directly in prod
- confirm public permissions are correct if the frontend depends on the collection

After applying the schema change:

- confirm the new field or collection appears in `Data Model`
- confirm the API returns the expected shape
- confirm the frontend still renders correctly
- restart Directus if the admin UI appears stale

## Useful Commands

From [`artifacts/directus`](/Users/jeremymarchandeau/Code/personal/projects/travelogue/artifacts/directus):

```sh
nvm use 22
pnpm install
pnpm run dev
pnpm run bootstrap
pnpm run schema:snapshot:local
pnpm run schema:apply:local
pnpm run schema:apply:prod
```
