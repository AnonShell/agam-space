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
  echo "Checking /data directory ownership..."
  # Try GNU stat (-c) first, then BSD stat (-f) as fallback
  DATA_UID=$(stat -c '%u' /data 2>/dev/null || stat -f '%u' /data 2>/dev/null)
  DATA_GID=$(stat -c '%g' /data 2>/dev/null || stat -f '%g' /data 2>/dev/null)

  echo "   /data is owned by UID=$DATA_UID, GID=$DATA_GID"

  if [ "$PUID" != "$DATA_UID" ] || [ "$PGID" != "$DATA_GID" ]; then
    echo "ERROR: PUID/PGID mismatch detected!" >&2
    echo "  Configured: PUID=$PUID, PGID=$PGID" >&2
    echo "  /data owner: UID=$DATA_UID, GID=$DATA_GID" >&2
    echo "" >&2
    echo "Solution:" >&2
    echo "  1. Set PUID=$DATA_UID and PGID=$DATA_GID in your docker-compose.yml, OR" >&2
    echo "  2. Change /data ownership on host: sudo chown -R $PUID:$PGID /path/to/data" >&2
    exit 1
  fi
  echo "   PUID/PGID matches /data ownership"
else
  echo "WARNING: /data directory does not exist, will be created on first mount"
fi

# Create group if it doesn't exist (check via /etc/group instead of getent)
echo "Setting up user and group..."
if ! grep -q "^[^:]*:[^:]*:$PGID:" /etc/group 2>/dev/null; then
  echo "   Creating group with GID=$PGID"
  addgroup -g "$PGID" appgroup 2>/dev/null || echo "   Group already exists"
else
  echo "   Group with GID=$PGID already exists"
fi

# Create user if it doesn't exist (check via /etc/passwd instead of getent)
if ! grep -q "^[^:]*:[^:]*:$PUID:" /etc/passwd 2>/dev/null; then
  echo "   Creating user with UID=$PUID"
  adduser -D -u "$PUID" -G appgroup appuser 2>/dev/null || echo "   User already exists"
else
  echo "   User with UID=$PUID already exists"
fi

echo "Dropping privileges and executing: $*"
echo "   Switching user to UID=$PUID, GID=$PGID"

# Drop privileges and run as the specified user (su-exec is installed via apk in Alpine)
exec su-exec "$PUID:$PGID" "$@"
