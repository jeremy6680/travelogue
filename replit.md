# Workspace

## Overview

pnpm workspace monorepo using TypeScript. A full-stack travel blog called "Wanderlust" with an interactive world map and travel timeline.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **Frontend**: React + Vite, Tailwind CSS, Framer Motion, react-simple-maps, wouter

## Structure

```text
artifacts-monorepo/
├── artifacts/              # Deployable applications
│   ├── api-server/         # Express API server
│   └── travel-blog/        # React+Vite travel blog frontend
├── lib/                    # Shared libraries
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   └── db/                 # Drizzle ORM schema + DB connection
├── scripts/                # Utility scripts
├── pnpm-workspace.yaml     # pnpm workspace
├── tsconfig.base.json      # Shared TS options
├── tsconfig.json           # Root TS project references
└── package.json            # Root package with hoisted devDeps
```

## Travel Blog Features

- **Interactive World Map**: SVG world map (react-simple-maps) with clickable pins at blog post locations. Visited countries are highlighted.
- **Travel Timeline**: Vertical timeline showing all visited countries with: country + cities, reason for visit, travel companions, friends/family met, links to related posts.
- **Blog Posts**: Full blog post pages with content, location info, and navigation.
- **Stats Dashboard**: Country count, continent count, dispatch count on homepage.
- **Admin Panel**: Form-based management for adding/editing posts and countries.

## Database Tables

- `posts` — Blog posts with title, slug, content, excerpt, cover image URL, lat/lng coordinates, location, country ID, published date
- `countries` — Visited countries with name, code, visited cities, reason for visit, travel companions, friends/family met, visited date, lat/lng

## API Endpoints

- `GET /api/posts` — List all posts
- `POST /api/posts` — Create post
- `GET /api/posts/:id` — Get post
- `PATCH /api/posts/:id` — Update post
- `DELETE /api/posts/:id` — Delete post
- `GET /api/map-pins` — Get posts with lat/lng for map pins
- `GET /api/countries` — List all visited countries
- `POST /api/countries` — Add visited country
- `GET /api/countries/:id` — Get country
- `PATCH /api/countries/:id` — Update country
- `DELETE /api/countries/:id` — Delete country
- `GET /api/stats` — Travel stats summary (countries, posts, cities, continents)

## TypeScript & Composite Projects

Every package extends `tsconfig.base.json` which sets `composite: true`. The root `tsconfig.json` lists all packages as project references.

- **Always typecheck from the root** — `pnpm run typecheck`
- **`emitDeclarationOnly`** — only `.d.ts` files during typecheck
- **Project references** — when package A depends on package B, A's `tsconfig.json` must list B

## Root Scripts

- `pnpm run build` — runs `typecheck` first, then recursively runs `build`
- `pnpm run typecheck` — runs `tsc --build --emitDeclarationOnly`

## Packages

### `artifacts/travel-blog` (`@workspace/travel-blog`)

React + Vite frontend. Serves at `/` (root path). Uses react-simple-maps for the world map, framer-motion for animations, wouter for routing.

### `artifacts/api-server` (`@workspace/api-server`)

Express 5 API server. Routes at `/api`. Uses @workspace/db for persistence, @workspace/api-zod for validation.

### `lib/db` (`@workspace/db`)

Database layer. Schema in `src/schema/`. Tables: `posts`, `countries`.

### `lib/api-spec` (`@workspace/api-spec`)

OpenAPI 3.1 spec + Orval codegen config.

Run codegen: `pnpm --filter @workspace/api-spec run codegen`

### `lib/api-zod` (`@workspace/api-zod`)

Generated Zod schemas. Used by `api-server` for validation.

### `lib/api-client-react` (`@workspace/api-client-react`)

Generated React Query hooks. Used by `travel-blog` frontend.
