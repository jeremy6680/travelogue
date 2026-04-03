# Directus on Coolify

This project can deploy Directus to Coolify directly from the repository.

## Files Added for Coolify

- Directus Docker image: [`artifacts/directus/Dockerfile`](/Users/jeremymarchandeau/Code/personal/projects/travelogue/artifacts/directus/Dockerfile)
- Example production env for Coolify: [`artifacts/directus/.env.coolify.example`](/Users/jeremymarchandeau/Code/personal/projects/travelogue/artifacts/directus/.env.coolify.example)

## Recommended Coolify Setup

Create a new **Application** in Coolify from this repository and configure:

- **Build Pack**: `Dockerfile`
- **Dockerfile Location**: `artifacts/directus/Dockerfile`
- **Build Context**: repository root
- **Port**: `8055`

This Dockerfile installs Directus as a standalone app with Node 22 and intentionally avoids the monorepo root `pnpm` overrides, because they can exclude Linux ARM native packages required on some Coolify hosts.

## Environment Variables

Start from:

```sh
artifacts/directus/.env.coolify.example
```

In Coolify, set at minimum:

```sh
HOST=0.0.0.0
PORT=8055
PUBLIC_URL=https://directus.your-domain.com
CORS_ENABLED=true
CORS_ORIGIN=https://travelogue.your-domain.com
DB_CLIENT=pg
DB_HOST=<your-postgres-host>
DB_PORT=5432
DB_DATABASE=travelogue
DB_USER=<your-postgres-user>
DB_PASSWORD=<your-postgres-password>
SECRET=<random-64-hex-or-similar-secret>
ADMIN_EMAIL=<your-admin-email>
ADMIN_PASSWORD=<your-admin-password>
STORAGE_LOCATIONS=local
STORAGE_LOCAL_ROOT=/data/uploads
LOG_LEVEL=info
```

Notes:

- `PUBLIC_URL` must be the final public Directus URL.
- `CORS_ORIGIN` should be the frontend production URL.
- `ADMIN_EMAIL` and `ADMIN_PASSWORD` are mainly used during first bootstrap of a fresh Directus database.

## Persistent Storage

Add a persistent volume in Coolify:

- **Container path**: `/data/uploads`

This keeps media uploads after redeploys.

## First Deployment

If the target database does not already contain the Directus system tables, bootstrap it once.

You can do that from a shell in the running container:

```sh
cd /app/artifacts/directus
pnpm bootstrap
```

After bootstrap, normal runtime is:

```sh
cd /app/artifacts/directus
pnpm start
```

The Docker container already starts with `pnpm start`, so bootstrap is only needed once for a fresh database.

## Applying the Saved Schema

After the first bootstrap, apply the repository schema snapshot:

```sh
cd /app/artifacts/directus
node ./node_modules/.bin/directus schema apply schema.yaml --yes
```

That will create the collections, fields, relations, and permissions stored in [`artifacts/directus/schema.yaml`](/Users/jeremymarchandeau/Code/personal/projects/travelogue/artifacts/directus/schema.yaml).

## Suggested Order

1. Create or connect a PostgreSQL database in Coolify.
2. Create the Directus application from this repo.
3. Add the environment variables.
4. Add the `/data/uploads` persistent volume.
5. Deploy once.
6. Run `pnpm bootstrap` if the database is fresh.
7. Run the schema apply command.
8. Open `/admin` on the Directus URL and verify login.

## Frontend Reminder

Once Directus is live, point the frontend to the new API URL via:

```sh
VITE_API_BASE_URL=https://directus.your-domain.com
```

You can use [`artifacts/travel-blog/.env.production.example`](/Users/jeremymarchandeau/Code/personal/projects/travelogue/artifacts/travel-blog/.env.production.example) as the reference value for production.
