FROM node:22-bookworm-slim

WORKDIR /app

COPY artifacts/directus/package.json ./package.json

# Install Directus as a standalone app inside the image.
# This avoids the monorepo pnpm overrides that strip Linux native optional deps
# needed on ARM hosts such as Coolify/Hetzner.
RUN npm install

COPY artifacts/directus ./

RUN mkdir -p /data/uploads

EXPOSE 8055

CMD ["npm", "run", "start"]
