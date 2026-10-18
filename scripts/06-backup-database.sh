#!/usr/bin/env bash
set -Eeuo pipefail

CONTAINER="hz-retail-pos-mongo"
DATABASE="hz_retail_pos"
BACKUP_DIR="${HOME}/hz-retail-pos-backups"
TIMESTAMP="$(date +%Y%m%d-%H%M%S)"
BACKUP_FILE="${BACKUP_DIR}/${DATABASE}-${TIMESTAMP}.archive.gz"
TEMP_FILE="${BACKUP_FILE}.tmp"

cleanup() {
  rm -f -- "$TEMP_FILE"
}
trap cleanup EXIT

if ! command -v docker >/dev/null 2>&1; then
  echo "ERROR: Docker is not installed or unavailable." >&2
  exit 1
fi

if ! docker inspect "$CONTAINER" >/dev/null 2>&1; then
  echo "ERROR: MongoDB container '$CONTAINER' does not exist." >&2
  exit 1
fi

if [[ "$(docker inspect -f '{{.State.Running}}' "$CONTAINER")" != "true" ]]; then
  echo "ERROR: MongoDB container '$CONTAINER' is not running." >&2
  exit 1
fi

mkdir -p -- "$BACKUP_DIR"

if [[ -e "$BACKUP_FILE" || -e "$TEMP_FILE" ]]; then
  echo "ERROR: Backup destination already exists." >&2
  exit 1
fi

echo "Creating backup of database: $DATABASE"
echo "Destination: $BACKUP_FILE"

docker exec "$CONTAINER" \
  mongodump --db="$DATABASE" --archive --gzip > "$TEMP_FILE"

if [[ ! -s "$TEMP_FILE" ]]; then
  echo "ERROR: Backup archive is empty." >&2
  exit 1
fi

echo "Validating archive with mongorestore dry run..."

if ! docker exec -i "$CONTAINER" \
  mongorestore --archive --gzip --dryRun \
  < "$TEMP_FILE"; then
  echo "ERROR: Archive validation failed; backup not published." >&2
  exit 1
fi

mv -- "$TEMP_FILE" "$BACKUP_FILE"

echo
echo "Backup completed and validated."
ls -lh -- "$BACKUP_FILE"
echo "Previous backups were preserved."