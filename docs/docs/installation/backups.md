---
sidebar_position: 2
---

# Backups

How to backup and restore your Agam Space data.

## What to Backup

You need to backup two things:

1. **PostgreSQL database** - User accounts, file metadata, encryption keys
2. **File storage** - Encrypted file chunks

Both are required to restore your instance. Encrypted files are useless without
the database.

## Automated Backup Script

### Create Backup Script

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

echo "Backup completed: $BACKUP_DIR.tar.gz"
```

Make executable:

```bash
chmod +x /opt/agam-space/backup.sh
```

### Test Backup

Run manually to test:

```bash
/opt/agam-space/backup.sh
```

Check backup created:

```bash
ls -lh /backups/
```

### Schedule Automatic Backups

Add to crontab:

```bash
crontab -e
```

Add line:

```
0 2 * * * /opt/agam-space/backup.sh >> /var/log/agam-backup.log 2>&1
```

This runs daily at 2 AM and logs output.

## Restore from Backup

### Full Restore

Stop containers:

```bash
cd /opt/agam-space
docker-compose down
```

Extract backup:

```bash
cd /backups
tar -xzf agam-20241221.tar.gz
```

Restore database:

```bash
cd /opt/agam-space
docker-compose up -d postgres
sleep 5  # Wait for postgres to start
cat /backups/agam-20241221/database.sql | docker exec -i agam-space-postgres-1 psql -U postgres agam_space
```

Restore files:

```bash
rm -rf /opt/agam-space/data/files
cp -r /backups/agam-20241221/files /opt/agam-space/data/
chown -R 1000:1000 /opt/agam-space/data/files
```

Start all containers:

```bash
docker-compose up -d
```

Verify:

```bash
docker-compose logs -f
```

### Database-Only Restore

If you only need to restore database (files intact):

```bash
cat backup/database.sql | docker exec -i agam-space-postgres-1 psql -U postgres agam_space
docker-compose restart agam
```

## Off-Site Backups

### Option 1: rsync to Remote Server

Add to backup script after compression:

```bash
# Sync to remote server
rsync -avz --delete /backups/ user@backup-server:/backups/agam-space/
```

### Option 2: Cloud Storage (S3, B2, etc.)

Install rclone:

```bash
curl https://rclone.org/install.sh | sudo bash
```

Configure remote:

```bash
rclone config
```

Add to backup script:

```bash
# Upload to cloud
rclone copy /backups/ remote:agam-backups/
```

### Option 3: Encrypted Cloud Backup

Use restic for encrypted backups:

```bash
sudo apt install restic
```

Initialize repository:

```bash
restic -r /backups/restic-repo init
```

Add to backup script:

```bash
# Backup with restic
restic -r /backups/restic-repo backup /opt/agam-space/data
```

## Backup Verification

Test your backups regularly:

```bash
#!/bin/bash
# test-restore.sh

# Create test directory
TEST_DIR="/tmp/agam-restore-test"
mkdir -p "$TEST_DIR"

# Extract latest backup
LATEST_BACKUP=$(ls -t /backups/agam-*.tar.gz | head -1)
tar -xzf "$LATEST_BACKUP" -C "$TEST_DIR"

# Verify database backup
if [ -f "$TEST_DIR/*/database.sql" ]; then
    echo "✅ Database backup found"
else
    echo "❌ Database backup missing"
    exit 1
fi

# Verify files backup
if [ -d "$TEST_DIR/*/files" ]; then
    echo "✅ Files backup found"
else
    echo "❌ Files backup missing"
    exit 1
fi

# Cleanup
rm -rf "$TEST_DIR"

echo "✅ Backup verification passed"
```

Run monthly:

```bash
chmod +x /opt/agam-space/test-restore.sh
# Add to crontab: 0 3 1 * * /opt/agam-space/test-restore.sh
```

## Backup Best Practices

**Retention policy:**

- Keep daily backups for 7 days
- Keep weekly backups for 4 weeks
- Keep monthly backups for 12 months

**Storage:**

- Keep backups on different physical disk
- Off-site backup to protect against site failure
- Encrypt backups if storing in untrusted location

**Testing:**

- Test restore process quarterly
- Document restore procedures
- Time how long restore takes

**Monitoring:**

- Alert if backup fails
- Alert if backup size changes dramatically
- Track backup timing trends

## Disaster Recovery Plan

Document your recovery process:

1. **Preparation:** Have backup location, credentials ready
2. **New server:** Provision new server, install Docker
3. **Restore:** Follow restore steps above
4. **DNS:** Update DNS to point to new server
5. **Verify:** Test login, file access, encryption
6. **Monitor:** Watch for issues in first 24 hours

**Recovery Time Objective (RTO):** How long can you be down? **Recovery Point
Objective (RPO):** How much data loss is acceptable?

For most self-hosters: Daily backups (24h RPO) with 4-hour RTO is reasonable.

## Next Steps

🚀 **[First Steps](../configuration/first-steps.md)** - Initial configuration

🔧 **[Configuration](../configuration/index.md)** - Configure SSO, trusted
devices, and more
