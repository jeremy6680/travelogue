FROM node:22-bookworm-slim AS deps

WORKDIR /app

RUN corepack enable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc tsconfig.base.json tsconfig.json ./
COPY artifacts/api-server/package.json artifacts/api-server/package.json
COPY lib/api-zod/package.json lib/api-zod/package.json
COPY lib/db/package.json lib/db/package.json

RUN pnpm install --frozen-lockfile --filter @workspace/api-server...

FROM node:22-bookworm-slim AS build

WORKDIR /app

RUN corepack enable

COPY --from=deps /app/package.json /app/pnpm-lock.yaml /app/pnpm-workspace.yaml /app/.npmrc /app/tsconfig.base.json /app/tsconfig.json ./
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/artifacts/api-server/package.json artifacts/api-server/package.json
COPY --from=deps /app/lib/api-zod/package.json lib/api-zod/package.json
COPY --from=deps /app/lib/db/package.json lib/db/package.json

COPY artifacts/api-server artifacts/api-server
COPY lib/api-zod lib/api-zod
COPY lib/db lib/db

RUN pnpm --filter @workspace/api-server build

FROM node:22-bookworm-slim AS runtime

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

COPY --from=build /app/artifacts/api-server/dist ./dist

EXPOSE 3000

CMD ["node", "--enable-source-maps", "dist/index.mjs"]
