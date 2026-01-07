#!/bin/sh
set -e

# If PUID/PGID are not set, just run as root
if [ -z "$PUID" ] || [ -z "$PGID" ]; then
  echo "Running as root (PUID/PGID not set)"
  exec "$@"
fi

echo "Running with PUID=$PUID, PGID=$PGID"

# Validate PUID/PGID matches /data ownership
if [ -d /data ]; then
  # Try GNU stat (-c) first, then BSD stat (-f) as fallback
  DATA_UID=$(stat -c '%u' /data 2>/dev/null || stat -f '%u' /data 2>/dev/null)
  DATA_GID=$(stat -c '%g' /data 2>/dev/null || stat -f '%g' /data 2>/dev/null)

  if [ "$PUID" != "$DATA_UID" ] || [ "$PGID" != "$DATA_GID" ]; then
    echo "ERROR: PUID/PGID mismatch detected!"
    echo "  Configured: PUID=$PUID, PGID=$PGID"
    echo "  /data owner: UID=$DATA_UID, GID=$DATA_GID"
    echo ""
    echo "Solution:"
    echo "  1. Set PUID=$DATA_UID and PGID=$DATA_GID in your docker-compose.yml, OR"
    echo "  2. Change /data ownership on host: sudo chown -R $PUID:$PGID /path/to/data"
    exit 1
  fi
  echo "✓ PUID/PGID matches /data ownership"
fi

# Create group if it doesn't exist (check via /etc/group instead of getent)
if ! grep -q "^[^:]*:[^:]*:$PGID:" /etc/group 2>/dev/null; then
  addgroup -g "$PGID" appgroup 2>/dev/null || true
fi

# Create user if it doesn't exist (check via /etc/passwd instead of getent)
if ! grep -q "^[^:]*:[^:]*:$PUID:" /etc/passwd 2>/dev/null; then
  adduser -D -u "$PUID" -G appgroup appuser 2>/dev/null || true
fi

# Drop privileges and run as the specified user
# Try su-exec (Alpine), then gosu (Debian), then fallback to su
if command -v su-exec >/dev/null 2>&1; then
  exec su-exec "$PUID:$PGID" "$@"
elif command -v gosu >/dev/null 2>&1; then
  exec gosu "$PUID:$PGID" "$@"
else
  exec su -s /bin/sh appuser -c "exec $*"
fi
