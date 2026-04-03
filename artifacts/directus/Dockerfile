FROM node:20-bookworm-slim

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

RUN corepack enable

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY artifacts/directus/package.json artifacts/directus/package.json

RUN pnpm install --filter @workspace/directus... --frozen-lockfile

COPY artifacts/directus ./artifacts/directus

WORKDIR /app/artifacts/directus

RUN mkdir -p /data/uploads

EXPOSE 8055

CMD ["pnpm", "start"]
