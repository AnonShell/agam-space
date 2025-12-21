---
sidebar_position: 7
---

# User Management

Manage users, add new users, and configure storage quotas.

## Add New Users

### Enable Signups Temporarily

Edit `docker-compose.yml`:

```yaml
ALLOW_NEW_SIGNUP: 'true'
```

Restart:

```bash
docker-compose restart agam
```

Share signup link with the person: `https://files.yourdomain.com/signup`

After they sign up, disable signups:

```yaml
ALLOW_NEW_SIGNUP: 'false'
```

Restart again:

```bash
docker-compose restart agam
```

### User Isolation

**Important:** Each user has completely separate encrypted storage:

- Users cannot see each other's files
- Each user has their own master password and CMK
- No sharing between users (yet - planned feature)
- Storage quotas are per-user

## Storage Quotas

Default quota: **10GB per user**

### View Current Quotas

```bash
docker exec -it agam-space-postgres-1 psql -U postgres -d agam_space

SELECT email, storage_quota, storage_used FROM users;

\q
```

### Set Custom Quota

```bash
docker exec -it agam-space-postgres-1 psql -U postgres -d agam_space

-- Set 50GB quota (in bytes)
UPDATE users SET storage_quota = 53687091200 WHERE email = 'user@example.com';

-- Set 1TB quota
UPDATE users SET storage_quota = 1099511627776 WHERE email = 'user@example.com';

\q
```

### Set Unlimited Quota

```bash
UPDATE users SET storage_quota = NULL WHERE email = 'user@example.com';
```

**Warning:** Unlimited quota means user can fill entire disk. Monitor disk
space.

### Change Default Quota

Default quota is set at application level. To change default for new users,
you'll need to modify the server configuration (admin UI coming soon).

For now, change quotas after user creation using SQL above.

## User Roles

Three roles:

- **Owner** - First user, full admin access
- **Admin** - Can manage users (future feature)
- **User** - Regular user, can only access their own files

Currently all users are "user" role except the first account (owner).

## Remove User

**Warning:** This permanently deletes the user and all their encrypted files!

```bash
docker exec -it agam-space-postgres-1 psql -U postgres -d agam_space

-- View users first
SELECT id, email FROM users;

-- Delete user (replace with actual email)
DELETE FROM users WHERE email = 'user@example.com';

\q
```

Also delete their files from disk:

```bash
# Find user directory
ls -la /opt/agam-space/data/files/

# Delete user directory (u-<userId>)
rm -rf /opt/agam-space/data/files/u-abc123/
```

## Reset User Password

User can reset their own **login password** (not master password):

**From UI:**

1. User goes to Settings → Account
2. Click "Change Password"
3. Enter current password
4. Enter new password

**Master password** can only be changed from within the app after unlocking:

1. Settings → Security → Change Master Password
2. Enter current master password
3. Enter new master password
4. All encryption keys re-wrapped with new master password

**Forgot master password?**

Must use recovery key. No admin recovery (by design - zero-knowledge
encryption).

## Monitor User Storage

```bash
docker exec -it agam-space-postgres-1 psql -U postgres -d agam_space

-- View all users with storage usage
SELECT
  email,
  pg_size_pretty(storage_used::bigint) as used,
  pg_size_pretty(storage_quota::bigint) as quota,
  ROUND((storage_used::float / storage_quota::float * 100)::numeric, 2) as percent_used
FROM users
WHERE storage_quota IS NOT NULL
ORDER BY storage_used DESC;

\q
```

## CORS Configuration

For production, restrict CORS to your domain:

```yaml
CORS_ORIGIN: 'https://files.yourdomain.com'
```

For multiple domains:

```yaml
CORS_ORIGIN: 'https://files.yourdomain.com,https://backup.yourdomain.com'
```

## Next Steps

🔧 **[SSO Configuration](./sso.md)** - Configure single sign-on

🔐 **[Trusted Devices](./trusted-devices.md)** - Biometric unlock

💾 **[Backups](../installation/backups.md)** - Set up automated backups
