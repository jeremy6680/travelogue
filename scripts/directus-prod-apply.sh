#!/usr/bin/env bash

set -euo pipefail

# Usage:
#   bash ./scripts/directus-prod-apply.sh
#
# Optional overrides:
#   SSH_HOST=root@example.com \
#   SSH_KEY_PATH=~/.ssh/id_ed25519 \
#   DIRECTUS_CONTAINER_PREFIX=my-directus- \
#   bash ./scripts/directus-prod-apply.sh

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SCHEMA_LOCAL_PATH="${SCHEMA_LOCAL_PATH:-$ROOT_DIR/artifacts/directus/schema.yaml}"
SSH_KEY_PATH="${SSH_KEY_PATH:-$HOME/.ssh/id_ed25519}"
SSH_HOST="${SSH_HOST:-root@46.224.175.91}"
REMOTE_SCHEMA_PATH="${REMOTE_SCHEMA_PATH:-/root/schema.yaml}"
DIRECTUS_CONTAINER_PREFIX="${DIRECTUS_CONTAINER_PREFIX:-yrkr6fhj921q8cjoilazkjce-}"

if [[ ! -f "$SCHEMA_LOCAL_PATH" ]]; then
  echo "Schema file not found: $SCHEMA_LOCAL_PATH" >&2
  exit 1
fi

if [[ ! -f "$SSH_KEY_PATH" ]]; then
  echo "SSH key not found: $SSH_KEY_PATH" >&2
  exit 1
fi

echo "Copying schema.yaml to $SSH_HOST:$REMOTE_SCHEMA_PATH"
scp -i "$SSH_KEY_PATH" "$SCHEMA_LOCAL_PATH" "$SSH_HOST:$REMOTE_SCHEMA_PATH"

echo "Applying schema inside the current Directus container"
ssh -i "$SSH_KEY_PATH" "$SSH_HOST" "
set -euo pipefail
DIRECTUS_CONTAINER=\$(docker ps --format '{{.Names}}' | grep '^$DIRECTUS_CONTAINER_PREFIX' | head -n 1)
if [ -z \"\$DIRECTUS_CONTAINER\" ]; then
  echo 'No Directus container found matching prefix: $DIRECTUS_CONTAINER_PREFIX' >&2
  exit 1
fi
echo \"Using Directus container: \$DIRECTUS_CONTAINER\"
docker cp '$REMOTE_SCHEMA_PATH' \"\$DIRECTUS_CONTAINER\":/app/schema.yaml
docker exec -i \"\$DIRECTUS_CONTAINER\" sh -lc 'cd /app && node ./node_modules/directus/cli.js schema apply schema.yaml --yes'
"
