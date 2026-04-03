# Directus Guide

This project uses Directus from [`artifacts/directus`](/Users/jeremymarchandeau/Code/personal/projects/travelogue/artifacts/directus) on top of the shared PostgreSQL database.

## Where Directus Lives

- Directus app: [`artifacts/directus`](/Users/jeremymarchandeau/Code/personal/projects/travelogue/artifacts/directus)
- Directus env example: [`artifacts/directus/.env.example`](/Users/jeremymarchandeau/Code/personal/projects/travelogue/artifacts/directus/.env.example)
- Directus package scripts: [`artifacts/directus/package.json`](/Users/jeremymarchandeau/Code/personal/projects/travelogue/artifacts/directus/package.json)
- Schema snapshot file: [`artifacts/directus/schema.yaml`](/Users/jeremymarchandeau/Code/personal/projects/travelogue/artifacts/directus/schema.yaml)

## Important Node Version

Use Node 20 inside the Directus app.

The file [`artifacts/directus/.nvmrc`](/Users/jeremymarchandeau/Code/personal/projects/travelogue/artifacts/directus/.nvmrc) contains:

```sh
20
```

Before running Directus commands:

```sh
cd /Users/jeremymarchandeau/Code/personal/projects/travelogue/artifacts/directus
nvm use 20
```

If you run Directus with another Node version, native modules such as `isolated-vm` may fail with an ABI mismatch error.

## Environment Files

Local development uses:

```sh
artifacts/directus/.env
```

Production apply uses:

```sh
artifacts/directus/.env.production
```

At minimum, Directus needs the database variables and a `SECRET`.

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

Bootstrap Directus only on the first run, or when initializing a fresh Directus system database:

```sh
cd /Users/jeremymarchandeau/Code/personal/projects/travelogue/artifacts/directus
nvm use 20
pnpm install
pnpm run bootstrap
```

This creates the Directus system tables and the admin account from `.env`.

## Start Directus Locally

```sh
cd /Users/jeremymarchandeau/Code/personal/projects/travelogue/artifacts/directus
nvm use 20
pnpm install
pnpm run dev
```

Default URLs:

- API: `http://localhost:8055`
- Admin: `http://localhost:8055/admin`

## Schema Workflow

This repo now includes three Directus schema scripts:

```sh
pnpm run schema:snapshot:local
pnpm run schema:apply:local
pnpm run schema:apply:prod
```

These are defined in [`artifacts/directus/package.json`](/Users/jeremymarchandeau/Code/personal/projects/travelogue/artifacts/directus/package.json).

### 1. Export the Current Local Schema

Run this after you changed collections, fields, relations, permissions, or other structure in your local Directus instance:

```sh
cd /Users/jeremymarchandeau/Code/personal/projects/travelogue/artifacts/directus
nvm use 20
pnpm run schema:snapshot:local
```

This writes the current schema to:

```sh
artifacts/directus/schema.yaml
```

Important:

- This exports schema only, not content.
- This should be committed when the CMS structure changes.

### 2. Apply the Schema to Local

If you need to reapply the saved schema to a local Directus database:

```sh
cd /Users/jeremymarchandeau/Code/personal/projects/travelogue/artifacts/directus
nvm use 20
pnpm run schema:apply:local
```

This uses the local `.env` file already present in the Directus app directory.

### 3. Apply the Schema to Production

Before applying to production:

- make sure [`artifacts/directus/.env.production`](/Users/jeremymarchandeau/Code/personal/projects/travelogue/artifacts/directus/.env.production) exists
- verify that it points to the real production database
- take a database backup first

Then run:

```sh
cd /Users/jeremymarchandeau/Code/personal/projects/travelogue/artifacts/directus
nvm use 20
pnpm run schema:apply:prod
```

The prod script is:

```sh
node --env-file=.env.production ./node_modules/.bin/directus schema apply schema.yaml --yes
```

The `--yes` flag skips the interactive confirmation.

## Recommended Team Workflow

When changing Directus structure locally:

1. Start Directus locally.
2. Make structural changes in the Directus admin.
3. Export the schema with `pnpm run schema:snapshot:local`.
4. Commit the updated [`artifacts/directus/schema.yaml`](/Users/jeremymarchandeau/Code/personal/projects/travelogue/artifacts/directus/schema.yaml).
5. Review the diff before merging.
6. Apply the schema in production with `pnpm run schema:apply:prod`.

## What Is Not Included in `schema.yaml`

The schema snapshot does not include:

- content items
- uploaded files
- local uploads directory contents
- database backups

If you need content migration, handle that separately from the Directus schema workflow.

## Common Errors

### `DB_CLIENT Environment Variable is missing`

Cause:

- you ran the command from the wrong directory
- or the Directus env file was not loaded

Fix:

```sh
cd /Users/jeremymarchandeau/Code/personal/projects/travelogue/artifacts/directus
nvm use 20
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

### `isolated-vm` / `NODE_MODULE_VERSION` mismatch

Cause:

- dependencies were installed with a different Node version than the one currently running

Fix:

```sh
cd /Users/jeremymarchandeau/Code/personal/projects/travelogue/artifacts/directus
nvm use 20
pnpm install
```

Then retry the Directus command.

## Safe Production Checklist

Before `schema:apply:prod`:

- confirm you are on the correct branch
- confirm `schema.yaml` is the version you want to deploy
- confirm `.env.production` points to production
- confirm a DB backup exists
- confirm nobody is making conflicting schema changes manually in prod

## Useful Commands

From [`artifacts/directus`](/Users/jeremymarchandeau/Code/personal/projects/travelogue/artifacts/directus):

```sh
nvm use 20
pnpm install
pnpm run dev
pnpm run bootstrap
pnpm run schema:snapshot:local
pnpm run schema:apply:local
pnpm run schema:apply:prod
```
