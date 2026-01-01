---
sidebar_position: 7
---

# User Management

Manage users and configure storage quotas.

:::info Admin Console

Currently, most user management requires direct database access. Admin UI
features are being continuously improved and will be added in future releases.

:::

## Add New Users

Enable signups temporarily:

```yaml
ALLOW_NEW_SIGNUP: 'true'
```

Restart:

```bash
docker-compose restart agam
```

Share signup link: `https://files.yourdomain.com/signup`

After signup, disable it:

```yaml
ALLOW_NEW_SIGNUP: 'false'
docker-compose restart agam
```

## Storage Quotas

Default quota: 10GB per user

### View Quotas

```bash
docker exec -it agam-space-postgres-1 psql -U postgres -d agam_space -c \
  "SELECT username, storage_quota, storage_used FROM users;"
```

### Set Custom Quota

```bash
docker exec -it agam-space-postgres-1 psql -U postgres -d agam_space -c \
  "UPDATE users SET storage_quota = 53687091200 WHERE username = 'john';"
```

Common quota values (in bytes):

- 50GB: `53687091200`
- 100GB: `107374182400`
- 1TB: `1099511627776`

### Unlimited Quota

```bash
docker exec -it agam-space-postgres-1 psql -U postgres -d agam_space -c \
  "UPDATE users SET storage_quota = NULL WHERE username = 'john';"
```

## Remove User

```bash
docker exec -it agam-space-postgres-1 psql -U postgres -d agam_space -c \
  "DELETE FROM users WHERE username = 'john';"
```

Also delete their files:

```bash
# Find user ID from database output, then:
rm -rf /opt/agam-space/data/files/u-<userId>/
```

## Monitor Storage Usage

```bash
docker exec -it agam-space-postgres-1 psql -U postgres -d agam_space -c \
  "SELECT username,
          pg_size_pretty(storage_used::bigint) as used,
          pg_size_pretty(storage_quota::bigint) as quota
   FROM users
   ORDER BY storage_used DESC;"
```
