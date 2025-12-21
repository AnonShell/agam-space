---
sidebar_position: 4
---

# Configuration

Configure and customize your Agam Space instance.

## Getting Started

After installing Agam Space, configure these essentials:

### Required

🚀 **[First Steps](./first-steps.md)** - Create admin account and disable
signups

💾 **[Backups](../installation/backups.md)** - Set up automated backups
(critical!)

### Optional

🔧 **[Single Sign-On](./sso.md)** - Configure Authelia, Authentik, Keycloak, or
cloud providers

🔐 **[Trusted Devices](./trusted-devices.md)** - Unlock with biometrics (Touch
ID, Face ID, Windows Hello)

👥 **[User Management](./user-management.md)** - Add users, set storage quotas,
manage permissions

## Configuration Files

Main configuration is in `docker-compose.yml`:

```yaml
agam:
  environment:
    # Database
    DATABASE_HOST: postgres
    DATABASE_PASSWORD: ${DB_PASSWORD}

    # Server
    HTTP_PORT: 3331

    # Access Control
    ALLOW_NEW_SIGNUP: 'false'
    CORS_ORIGIN: 'https://files.yourdomain.com'

    # SSO (Optional)
    SSO_ISSUER: 'https://auth.yourdomain.com'
    SSO_CLIENT_ID: 'agam-space'
    SSO_CLIENT_SECRET: '${SSO_CLIENT_SECRET}'
    SSO_REDIRECT_URI: 'https://files.yourdomain.com/api/v1/auth/sso/oidc/callback'
    SSO_AUTO_CREATE_USER: 'false'
    DOMAIN: 'https://files.yourdomain.com'
```

## Common Tasks

**Add a new user:**

- Temporarily enable signups
- User signs up
- Disable signups again
- See [User Management](./user-management.md)

**Enable SSO login:**

- Configure OAuth provider (Authelia, Authentik, Keycloak, Google, GitHub)
- Add SSO variables to docker-compose.yml
- See [Single Sign-On](./sso.md)

**Set up biometric unlock:**

- Requires HTTPS
- Register device in Settings
- See [Trusted Devices](./trusted-devices.md)

**Change storage quota:**

- Connect to database
- Run UPDATE query
- See [User Management](./user-management.md#storage-quotas)

## Environment Variables Reference

| Variable               | Default    | Description                                    |
| ---------------------- | ---------- | ---------------------------------------------- |
| `DATABASE_HOST`        | postgres   | Database hostname                              |
| `DATABASE_PORT`        | 5432       | Database port                                  |
| `DATABASE_USERNAME`    | postgres   | Database user                                  |
| `DATABASE_PASSWORD`    | -          | Database password (required)                   |
| `DATABASE_NAME`        | agam_space | Database name                                  |
| `HTTP_PORT`            | 3331       | Server port                                    |
| `ALLOW_NEW_SIGNUP`     | false      | Allow new user registration                    |
| `CORS_ORIGIN`          | \*         | Allowed CORS origins                           |
| `SSO_ISSUER`           | -          | SSO provider URL (optional)                    |
| `SSO_CLIENT_ID`        | -          | OAuth client ID (optional)                     |
| `SSO_CLIENT_SECRET`    | -          | OAuth client secret (optional)                 |
| `SSO_REDIRECT_URI`     | -          | OAuth callback URL (optional)                  |
| `SSO_AUTO_CREATE_USER` | false      | Auto-create user on first SSO login (optional) |
| `DOMAIN`               | localhost  | Application domain (optional)                  |

For complete variable list, see individual configuration pages.

## Security Best Practices

After initial setup:

- ✅ Disable public signups (`ALLOW_NEW_SIGNUP: "false"`)
- ✅ Set specific CORS origin (not `*`)
- ✅ Use strong database password (32+ random characters)
- ✅ Run behind HTTPS reverse proxy
- ✅ Set up automated backups
- ✅ Keep Docker images updated
- ✅ Monitor disk space

## Getting Help

- Check [FAQ](../faq.md) for common questions
- Review specific configuration pages for detailed guides
- Check Docker logs: `docker-compose logs -f agam`
