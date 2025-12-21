---
sidebar_position: 2
---

# Single Sign-On

Configure SSO login with self-hosted authentication servers or cloud providers.

## Supported Providers

**Self-hosted (Recommended):**

- Authelia - Lightweight, easy to configure
- Authentik - Feature-rich, modern UI
- Keycloak - Enterprise-grade
- Zitadel - Cloud-native identity platform

**Cloud providers:**

- Google
- GitHub
- Microsoft
- Auth0

Any OIDC-compatible provider works.

## SSO with Authelia

Authelia is a popular lightweight open-source authentication server.

### Prerequisites

- Authelia already installed and configured
- Domain names configured (e.g., auth.yourdomain.com, files.yourdomain.com)

### Configure Authelia

Add Agam Space as a client in Authelia config (`configuration.yml`):

```yaml
identity_providers:
  oidc:
    clients:
      - id: agam-space
        description: Agam Space File Storage
        secret: your_random_secret_here_min_32_chars
        redirect_uris:
          - https://files.yourdomain.com/api/v1/auth/oidc/callback
        scopes:
          - openid
          - email
          - profile
        grant_types:
          - authorization_code
        response_types:
          - code
```

Generate a secure secret:

```bash
openssl rand -base64 32
```

Restart Authelia:

```bash
docker-compose restart authelia
```

### Configure Agam Space

Add to your `docker-compose.yml`:

```yaml
agam:
  environment:
    # ...existing variables...

    # SSO Configuration
    SSO_ISSUER: 'https://auth.yourdomain.com'
    SSO_CLIENT_ID: 'agam-space'
    SSO_CLIENT_SECRET: 'your_random_secret_here_min_32_chars'
    SSO_REDIRECT_URI: 'https://files.yourdomain.com/api/v1/auth/sso/oidc/callback'
    SSO_AUTO_CREATE_USER: 'false'
    DOMAIN: 'https://files.yourdomain.com'
```

Restart Agam Space:

```bash
docker-compose restart agam
```

### Test SSO Login

1. Open Agam Space login page
2. Click **Sign in with SSO**
3. Redirects to Authelia
4. Login with Authelia credentials
5. Redirects back to Agam Space
6. First SSO login creates a new account
7. Set master password (still required for encryption)

## SSO with Authentik

Authentik is a modern, feature-rich identity provider.

### Create Provider in Authentik

1. Login to Authentik admin panel
2. Go to **Applications** → **Providers**
3. Click **Create** → **OAuth2/OpenID Provider**
4. Configure:
   - Name: `Agam Space`
   - Client type: `Confidential`
   - Redirect URIs: `https://files.yourdomain.com/api/v1/auth/oidc/callback`
   - Scopes: `openid`, `email`, `profile`
5. Save and copy Client ID and Client Secret

### Create Application

1. Go to **Applications**
2. Click **Create**
3. Configure:
   - Name: `Agam Space`
   - Slug: `agam-space`
   - Provider: Select the provider created above
4. Save

### Configure Agam Space

```yaml
agam:
  environment:
    SSO_ISSUER: 'https://auth.yourdomain.com/application/o/agam-space/'
    SSO_CLIENT_ID: 'your-authentik-client-id'
    SSO_CLIENT_SECRET: 'your-authentik-client-secret'
    SSO_REDIRECT_URI: 'https://files.yourdomain.com/api/v1/auth/sso/oidc/callback'
    SSO_AUTO_CREATE_USER: 'false'
    DOMAIN: 'https://files.yourdomain.com'
```

## SSO with Keycloak

For those using Keycloak:

### Create Client

1. Login to Keycloak admin console
2. Select your realm
3. Go to **Clients** → **Create**
4. Configure:
   - Client ID: `agam-space`
   - Client Protocol: `openid-connect`
   - Root URL: `https://files.yourdomain.com`
5. Click **Save**

### Configure Client

1. Access Type: `confidential`
2. Valid Redirect URIs: `https://files.yourdomain.com/api/v1/auth/oidc/callback`
3. Save
4. Go to **Credentials** tab and copy Client Secret

### Configure Agam Space

```yaml
agam:
  environment:
    SSO_ISSUER: 'https://keycloak.yourdomain.com/realms/your-realm'
    SSO_CLIENT_ID: 'agam-space'
    SSO_CLIENT_SECRET: 'your-keycloak-client-secret'
    SSO_REDIRECT_URI: 'https://files.yourdomain.com/api/v1/auth/sso/oidc/callback'
    SSO_AUTO_CREATE_USER: 'false'
    DOMAIN: 'https://files.yourdomain.com'
```

## Cloud Providers

### Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 Client ID
5. Set redirect URI:
   `https://files.yourdomain.com/api/v1/auth/sso/oidc/callback`

```yaml
SSO_ISSUER: 'https://accounts.google.com'
SSO_CLIENT_ID: 'your-client-id.apps.googleusercontent.com'
SSO_CLIENT_SECRET: 'your-client-secret'
SSO_REDIRECT_URI: 'https://files.yourdomain.com/api/v1/auth/sso/oidc/callback'
SSO_AUTO_CREATE_USER: 'false'
DOMAIN: 'https://files.yourdomain.com'
```

### GitHub OAuth

1. GitHub Settings → Developer settings → OAuth Apps
2. New OAuth App
3. Callback URL: `https://files.yourdomain.com/api/v1/auth/sso/oidc/callback`

```yaml
SSO_ISSUER: 'https://github.com'
SSO_CLIENT_ID: 'your-github-client-id'
SSO_CLIENT_SECRET: 'your-github-client-secret'
SSO_REDIRECT_URI: 'https://files.yourdomain.com/api/v1/auth/sso/oidc/callback'
SSO_AUTO_CREATE_USER: 'false'
DOMAIN: 'https://files.yourdomain.com'
```

## How SSO Works

1. **Login:** User authenticates via SSO provider
2. **Account:** First SSO login creates Agam Space account
3. **Master Password:** User must still set master password
4. **Why?** Master password encrypts files - never sent to server or SSO
   provider
5. **Result:** Convenient login + end-to-end encryption

**Important:** SSO only handles authentication. Encryption keys are still
derived from your master password, which you must set separately.

## Disable Password Login

If you want SSO-only (no email/password login):

```yaml
ALLOW_PASSWORD_LOGIN: 'false'
```

**Warning:** Make sure SSO works first! Test with a different browser before
disabling password login.

## Troubleshooting

**SSO button doesn't appear:**

- Check all required SSO variables are set (SSO_ISSUER, SSO_CLIENT_ID,
  SSO_CLIENT_SECRET, SSO_REDIRECT_URI)
- Restart Agam Space after adding variables
- Check browser console for errors

**Redirect URI mismatch:**

- Check callback URL matches exactly in SSO provider
- Must be: `https://files.yourdomain.com/api/v1/auth/sso/oidc/callback`
- HTTPS required (not http)

**Authentication failed:**

- Check client ID and secret are correct
- Verify SSO_ISSUER URL is correct
- Check SSO provider logs

**Still asks for master password:**

- This is normal! Master password encrypts your files
- SSO handles authentication, not encryption
- You need both

## Security Notes

- SSO provider can see login activity
- SSO provider cannot decrypt your files (master password protects them)
- If SSO provider compromised: attacker can login but not decrypt files without
  master password
- Recommended: Use SSO + strong master password + trusted device unlock
