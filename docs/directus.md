# Directus Guide

This project uses Directus from [`artifacts/directus`](/Users/jeremymarchandeau/Code/personal/projects/travelogue/artifacts/directus) on top of the shared PostgreSQL database.

Deployment on Coolify is documented in [`docs/directus-coolify.md`](/Users/jeremymarchandeau/Code/personal/projects/travelogue/docs/directus-coolify.md).

## Quick Post-Deploy Checklist

Use this right after deploying a Directus schema change to production.

1. Apply the schema in production:

```sh
cd /app
node ./node_modules/directus/cli.js schema apply schema.yaml --yes
```

2. Restart Directus if the admin still looks stale.
3. Check `Settings` → `Data Model` and confirm the new fields or collections are visible.
4. Confirm `Public` still has `Read` access on the collections used by the frontend.
5. Test:

```txt
/server/ping
/items/posts?limit=1
/items/trips?limit=1
/items/photos?limit=1
```

6. Reload the public site and verify the new data flows through.

If something fails:

- `403` on `/items/...`: public permissions problem
- field missing in admin after successful apply: restart Directus
- `invalid input syntax for type json`: legacy DB values must be normalized before rerunning `schema apply`

## Where Directus Lives

- Directus app: [`artifacts/directus`](/Users/jeremymarchandeau/Code/personal/projects/travelogue/artifacts/directus)
- Directus local extensions: [`artifacts/directus/extensions`](/Users/jeremymarchandeau/Code/personal/projects/travelogue/artifacts/directus/extensions)
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

If `directus start` fails with an `isolated-vm` native module error, rebuild it under Node 22:

```sh
cd /Users/jeremymarchandeau/Code/personal/projects/travelogue/artifacts/directus
nvm use 22
npm rebuild isolated-vm
corepack pnpm run dev
```

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
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-cloudinary-api-key
CLOUDINARY_API_SECRET=your-cloudinary-api-secret
```

These Cloudinary variables are used by the custom Directus endpoint `cloudinary-upload`, which signs direct browser uploads for the frontend admin. The image file goes straight from the browser to Cloudinary, and only the metadata is written back into Directus.

For `media_assets`, the recommended workflow is now directly inside the Directus CMS:

1. Open the `Media Assets` collection in Directus.
2. Create a new item.
3. Use the custom `public_id` field interface to pick an image and upload it to Cloudinary.
4. Let the widget fill `public_id`, `delivery_url`, `width`, `height`, `format`, `resource_type`, `bytes`, and `folder`.
5. Adjust `title`, `alt`, or `caption` if needed.
6. Save the item in Directus.

This keeps Directus as the content source of truth while Cloudinary handles the actual image binary and delivery.

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

If the Directus admin behavior changes through local extensions, update the extension code in [`artifacts/directus/extensions`](/Users/jeremymarchandeau/Code/personal/projects/travelogue/artifacts/directus/extensions) too.

Important:

- this project keeps built Directus extension entrypoints in Git
- commit the `dist/index.js` files inside `artifacts/directus/extensions/**/dist/`
- production will not load the extension if those built files are missing from the deployed image

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
3. commit and push the schema change and any Directus extension changes
4. deploy Directus
5. apply the schema to production
6. restart Directus if the admin UI still shows stale metadata
7. verify the Data Model and API in production

If the feature depends on Directus local extensions, step 4 must finish successfully before step 5. `schema apply` alone cannot copy extension files into the running container.

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
node --env-file=.env.production ./node_modules/directus/cli.js schema apply schema.yaml --yes
```

If you prefer to run it inside the Coolify container:

```sh
cd /app
node ./node_modules/directus/cli.js schema apply schema.yaml --yes
```

### Recommended Remote Flow From Your Local Terminal

The most reliable production flow is to SSH into the server, find the current Directus container by name, then run `schema apply` inside that container.

1. Connect to the server:

```sh
ssh -i ~/.ssh/id_ed25519 root@46.224.175.91
```

2. Find the current Directus container:

```sh
docker ps --format 'table {{.ID}}\t{{.Names}}\t{{.Image}}'
```

Look for the container whose name starts with the Directus resource UUID. In this project it looks like:

```txt
yrkr6fhj921q8cjoilazkjce-...
```

Important:

- use the container name, not the container ID
- Coolify may recreate the container between deploys, so IDs are not stable

3. Apply the schema inside the running Directus container:

```sh
docker exec -it <directus-container-name> sh -lc 'cd /app && node ./node_modules/directus/cli.js schema apply schema.yaml --yes'
```

Example:

```sh
docker exec -it yrkr6fhj921q8cjoilazkjce-064216412101 sh -lc 'cd /app && node ./node_modules/directus/cli.js schema apply schema.yaml --yes'
```

4. If you updated `schema.yaml` locally first, copy it to the server and then into the container before running `schema apply`:

```sh
scp -i ~/.ssh/id_ed25519 /Users/jeremymarchandeau/Code/personal/projects/travelogue/artifacts/directus/schema.yaml root@46.224.175.91:/root/schema.yaml
```

Then on the server:

```sh
docker cp /root/schema.yaml <directus-container-name>:/app/schema.yaml
```

If you want to automate the whole SSH and Docker flow from your Mac, use:

```sh
bash /Users/jeremymarchandeau/Code/personal/projects/travelogue/scripts/directus-prod-apply.sh
```

Defaults built into this script:

- SSH host: `root@46.224.175.91`
- SSH key: `~/.ssh/id_ed25519`
- schema file: `artifacts/directus/schema.yaml`
- Directus container prefix: `yrkr6fhj921q8cjoilazkjce-`

You can override them when needed:

```sh
SSH_HOST=root@example.com DIRECTUS_CONTAINER_PREFIX=my-directus- bash /Users/jeremymarchandeau/Code/personal/projects/travelogue/scripts/directus-prod-apply.sh
```

5. If the admin UI still looks stale after a successful apply, restart the Directus application in Coolify and reload the admin.

### Production Extensions Checklist

When a production change includes Directus extensions:

1. commit and push the extension folder and its built `dist` entrypoints
2. redeploy the Directus app in Coolify
3. confirm the running container contains the files under `/app/extensions`
4. only then run `schema apply`

Quick verification on the server:

```sh
docker exec -it <directus-container-name> sh -lc 'find /app/extensions -maxdepth 3 -type f | sort'
```

You should see each extension entrypoint, for example:

```txt
/app/extensions/directus-extension-post-coordinate-sync/dist/index.js
```

### Production Pitfalls We Hit

These are the failure modes already seen on this project.

1. Calling `node ./node_modules/.bin/directus ...` fails.

Use:

```sh
node ./node_modules/directus/cli.js schema apply schema.yaml --yes
```

Do not call the shell wrapper in `node_modules/.bin` with `node`.

2. `psql` is not available in the Directus container.

Use the Postgres container for SQL inspection or fixes:

```sh
docker exec -it <postgres-container-name> psql -U travelogue -d postgres
```

3. `schema.yaml` can contain duplicate relations.

We hit a duplicated `posts.trip_id` relation in `artifacts/directus/schema.yaml`, which caused Directus to try creating two foreign keys for the same field during one `schema apply`.

If `schema apply` says a relation already exists but PostgreSQL does not show that constraint, inspect the schema file inside the running container:

```sh
docker exec -it <directus-container-name> sh -lc "grep -n 'posts_trip_id' /app/schema.yaml"
```

If the old and new relation blocks both exist, fix the local `schema.yaml`, copy it to the server again, and retry.

4. A relation can fail because the referenced lookup table exists locally but not in production.

We hit this with `countries`. If `schema apply` fails on a foreign key with a message like:

```txt
Key (country_code)=(FR) is not present in table "countries"
```

either:

- the `countries` table does not exist yet in production
- or it exists but the reference data has not been inserted yet

In that case, create or backfill the reference table in PostgreSQL first, then rerun `schema apply`.

5. `schema apply` succeeds, but Directus warns that extension files cannot be found.

If you see errors like:

```txt
Cannot find module '/app/extensions/<extension-name>/dist/index.js'
```

the production container does not contain the built extension files yet.

Usually this means one of these happened:

- the latest Directus deploy has not completed yet
- the extension `dist` files were not committed to Git

Fix the repo or redeploy first, then rerun `schema apply`.

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

### Seed the Countries Reference Table

The `countries` collection uses reference content, not only schema. `schema apply` creates the structure, but it does not insert the list of ISO countries.

Use these commands from the repository root:

Local:

```sh
pnpm run db:seed:countries:local
```

Production:

```sh
pnpm run db:seed:countries:prod
```

What this does:

- inserts the full ISO-style `countries` reference list
- safely ignores already existing country codes

Important production note:

- `db:seed:countries:prod` runs from your local machine
- therefore `DATABASE_URL` in `.env.production` must point to a PostgreSQL host that is reachable from your machine
- a Docker or Coolify internal hostname such as `f476zf8bk6iemsxe3pgzfc9m` will not work from your Mac
- for local execution, use the database public hostname or public IP and port instead

Valid example:

```env
DATABASE_URL=postgresql://travelogue:password@46.224.175.91:5432/postgres
```

If your public database requires SSL, use the appropriate query string, for example:

```env
DATABASE_URL=postgresql://travelogue:password@46.224.175.91:5432/postgres?sslmode=require
```

Recommended order when introducing or updating the taxonomy in production:

1. apply the Directus schema
2. seed the `countries` table
3. reload Directus admin
4. verify the country dropdowns now show the full list

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

## Cloudinary Media Model

Travelogue now expects a dedicated `media_assets` collection/table for Cloudinary-backed media metadata, with these relational links:

- `posts.featured_image_id`
- `trips.cover_image_id`
- `photos.media_asset_id`

After running the latest database migration, open Directus locally and refresh the schema snapshot so `artifacts/directus/schema.yaml` reflects the new collection metadata and field interfaces.

Recommended asset folders:

- `travelogue/posts`
- `travelogue/trips`
- `travelogue/home/featured`

Recommended content flow:

1. Upload the original image to Cloudinary from a trusted backend endpoint or signed-upload flow.
2. Persist the Cloudinary response metadata into `media_assets`.
3. Link posts, trips, and homepage/photo records to the relevant `media_assets` row.
4. Let the frontend build optimized Cloudinary delivery URLs using `public_id`.

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
