---
sidebar_position: 1
---

# Configuration Overview

Agam Space supports two methods of configuration with clear precedence rules.

## Configuration Methods

### 1. Environment Variables (Recommended for Docker)

Pass configuration through environment variables in `docker-compose.yml` or
`.env` file.

**Precedence:** Highest (overrides everything)

**Example:**

```yaml
environment:
  DATABASE_HOST: postgres
  DATABASE_USERNAME: postgres
  DATABASE_PASSWORD: secure_password
  HTTP_PORT: 3331
  ALLOW_NEW_SIGNUP: 'false'
```

### 2. Config File (Advanced)

Use a JSON configuration file for complex setups or managing multiple
environments.

**Precedence:** Medium (overrides schema defaults, overridden by env vars)

**Location:** `${CONFIG_DIR}/config.json` or `/data/config/config.json`

**Example:**

```json
{
  "server": {
    "port": 3331,
    "host": "0.0.0.0"
  },
  "database": {
    "host": "postgres",
    "port": 5432,
    "username": "postgres",
    "password": "secure_password",
    "database": "agam_space"
  },
  "account": {
    "allowNewSignup": false,
    "defaultUserStorageQuota": 50000000000
  }
}
```

## Configuration Precedence

Settings are loaded in this order (later overrides earlier):

```
Schema Defaults → Config File → Environment Variables
   (lowest)          (medium)         (highest)
```

**Example:** If you have:

- Schema default: `HTTP_PORT=3331`
- Config file: `"port": 8080`
- Environment: `HTTP_PORT=9000`

Result: Port `9000` is used (env var wins)

## Quick Start Examples

### Minimal Configuration (Environment Variables)

Only required variables:

```yaml
# docker-compose.yml
environment:
  DATABASE_HOST: postgres
  DATABASE_USERNAME: postgres
  DATABASE_PASSWORD: ${DB_PASSWORD}
```

All other settings use schema defaults.

### Production Configuration (Environment Variables)

```yaml
# docker-compose.yml
environment:
  # Database
  DATABASE_HOST: postgres
  DATABASE_USERNAME: postgres
  DATABASE_PASSWORD: ${DB_PASSWORD}
  DATABASE_NAME: agam_space

  # Server
  HTTP_PORT: 3331

  # CORS
  CORS_ORIGIN: https://files.yourdomain.com

  # Account
  ALLOW_NEW_SIGNUP: 'false'
  DEFAULT_USER_STORAGE_QUOTA: '50000000000'

  # WebAuthn
  DOMAIN: yourdomain.com
  WEBAUTHN_ORIGIN: https://files.yourdomain.com
  WEBAUTHN_RPID: yourdomain.com
```

### Config File Example

Create `/data/config/config.json`:

```json
{
  "server": {
    "port": 3331,
    "host": "0.0.0.0",
    "nodeEnv": "production"
  },
  "cors": {
    "origin": "https://files.yourdomain.com",
    "credentials": true
  },
  "database": {
    "host": "postgres",
    "port": 5432,
    "username": "postgres",
    "password": "secure_password",
    "database": "agam_space",
    "ssl": false,
    "maxConnections": 100
  },
  "account": {
    "allowNewSignup": false,
    "defaultUserStorageQuota": 50000000000
  },
  "files": {
    "maxFileSize": 2000000000,
    "chunkSize": 8388608,
    "trashCleanupIntervalDays": 14
  },
  "security": {
    "sessionTimeout": "7d"
  },
  "webauthn": {
    "origin": "https://files.yourdomain.com",
    "rpId": "yourdomain.com"
  },
  "domain": {
    "domain": "yourdomain.com"
  }
}
```

Mount config directory in docker-compose:

```yaml
volumes:
  - ./config:/data/config
```

## Hybrid Approach

**Best practice:** Use config file for static settings, environment variables
for secrets.

**config.json:**

```json
{
  "server": {
    "port": 3331
  },
  "account": {
    "allowNewSignup": false,
    "defaultUserStorageQuota": 50000000000
  }
}
```

**docker-compose.yml:**

```yaml
environment:
  # Secrets in env vars (not in config file)
  DATABASE_PASSWORD: ${DB_PASSWORD}
  SSO_CLIENT_SECRET: ${SSO_SECRET}
```

## Configuration Validation

Agam Space validates all configuration on startup:

✅ **Valid config:** Server starts normally ❌ **Invalid config:** Server fails
with clear error message

**Common validation errors:**

- Missing required variables (DATABASE_HOST, DATABASE_USERNAME, etc.)
- Invalid data types (e.g., port as string instead of number)
- Out-of-range values (e.g., port > 65535)

## Directory Configuration

Agam Space automatically creates required directories on first run:

```
/data/              # DATA_DIR (default)
  ├── files/        # File storage
  ├── config/       # Configuration
  ├── logs/         # Application logs
  └── cache/        # Cache data
```

**Custom directory paths:**

```yaml
environment:
  DATA_DIR: /custom/data
  FILES_DIR: /mnt/storage/files
  LOG_DIR: /var/log/agam
```

## Available Configuration Sections

📋 **[Configuration Reference](./configuration-reference.md)** - Complete list
showing both environment variables and config file properties

**By category:**

- **Server** - HTTP port, host, API prefix
- **Database** - PostgreSQL connection settings
- **CORS** - Cross-origin resource sharing
- **Account** - User signup, storage quotas
- **Files** - Upload limits, chunk size, trash cleanup
- **Security** - Session timeout, max sessions
- **SSO** - OIDC single sign-on (optional)
- **WebAuthn** - Biometric device unlock (optional)
- **Directories** - Custom data paths

## Troubleshooting

### Config not loading

Check logs on startup:

```bash
docker-compose logs agam
```

Look for:

```
🚀 Bootstrapping Agam Space...
✅ DATA_DIR (from env): /data
📋 Configuration Summary:
   App: Agam Space API v0.1.0
   Server: 0.0.0.0:3331
```

### Environment variables not working

**Problem:** Boolean values

```yaml
# ❌ Wrong
ALLOW_NEW_SIGNUP: false

# ✅ Correct
ALLOW_NEW_SIGNUP: 'false'
```

**Problem:** Numbers

```yaml
# ❌ Wrong (treated as string)
HTTP_PORT: '3331'

# ✅ Correct
HTTP_PORT: 3331

# ✅ Also works (coerced)
HTTP_PORT: '3331'
```

### Config file not found

Agam Space looks for config at: `${CONFIG_DIR}/config.json` or
`/data/config/config.json`

If not found, it proceeds with environment variables and defaults (this is
normal).

To use config file:

1. Create `/data/config/config.json`
2. Or set `CONFIG_DIR` environment variable

## Next Steps

📚 **[Configuration Reference](./configuration-reference.md)** - Full list with
both ENV vars and config file properties

🔧 **[SSO Configuration](./sso.md)** - OIDC single sign-on setup

🔐 **[Trusted Devices](./trusted-devices.md)** - WebAuthn biometric unlock
