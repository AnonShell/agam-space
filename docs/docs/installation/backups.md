---
sidebar_position: 2
---

# Backups

How to backup and restore your Agam Space data.

## What to Backup

You need to backup two things:

1. **PostgreSQL database** - User accounts, file metadata, encryption keys
2. **File storage** - Encrypted file chunks

Both are required to restore your instance.

## Backup Script

Create `/opt/agam-space/backup.sh`:

```bash
#!/bin/bash
BACKUP_DIR="/backups/agam-$(date +%Y%m%d)"
mkdir -p "$BACKUP_DIR"

# Backup database
docker exec agam-space-postgres-1 pg_dump -U postgres agam_space > "$BACKUP_DIR/database.sql"

# Backup files
cp -r /opt/agam-space/data/files "$BACKUP_DIR/"

# Compress
tar -czf "$BACKUP_DIR.tar.gz" -C /backups "$(basename $BACKUP_DIR)"
rm -rf "$BACKUP_DIR"

# Keep last 30 days
find /backups -name "agam-*.tar.gz" -mtime +30 -delete
```

Make executable:

```bash
chmod +x /opt/agam-space/backup.sh
```

Test:

```bash
/opt/agam-space/backup.sh
```

### Schedule Automatic Backups

Add to crontab for daily backups at 2 AM:

```bash
crontab -e
```

Add:

```
0 2 * * * /opt/agam-space/backup.sh >> /var/log/agam-backup.log 2>&1
```

## Restore from Backup

Stop containers:

```bash
cd /opt/agam-space
docker-compose down
```

Extract backup:

```bash
tar -xzf /backups/agam-20241221.tar.gz -C /backups/
```

Restore database:

```bash
docker-compose up -d postgres
sleep 5
cat /backups/agam-20241221/database.sql | docker exec -i agam-space-postgres-1 psql -U postgres agam_space
```

Restore files:

```bash
rm -rf /opt/agam-space/data/files
cp -r /backups/agam-20241221/files /opt/agam-space/data/
chown -R 1000:1000 /opt/agam-space/data/files
```

Start containers:

```bash
docker-compose up -d
```

## Next Steps

🚀 **[First Steps](../configuration/first-steps.md)** - Initial configuration
