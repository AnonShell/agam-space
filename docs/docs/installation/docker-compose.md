---
sidebar_position: 1
---

# Docker Compose (Recommended)

The easiest and recommended way to run Agam Space in production.

## Prerequisites

- Docker and Docker Compose installed
- Domain name (optional, for HTTPS)

## Basic Installation

Create a directory:

```bash
mkdir agam-space && cd agam-space
```

Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: agam_space
    volumes:
      - ./data/postgres:/var/lib/postgresql/data
    restart: unless-stopped
    networks:
      - agam

  agam:
    image: yourdockerhub/agam-space:latest
    ports:
      - '3331:3331'
    environment:
      DATABASE_HOST: postgres
      DATABASE_PORT: 5432
      DATABASE_USERNAME: postgres
      DATABASE_PASSWORD: ${DB_PASSWORD}
      DATABASE_NAME: agam_space
      HTTP_PORT: 3331
      ALLOW_NEW_SIGNUP: 'true'
      CORS_ORIGIN: '*'
    volumes:
      - ./data/files:/data/files
    depends_on:
      - postgres
    restart: unless-stopped
    networks:
      - agam

networks:
  agam:
```

Create `.env` file:

```bash
DB_PASSWORD=your_secure_password_here
```

Set permissions:

```bash
chmod 600 .env
```

Start containers:

```bash
docker-compose up -d
```

Access at `http://localhost:3331`

## Environment Variables

| Variable            | Default    | Description                  |
| ------------------- | ---------- | ---------------------------- |
| `DATABASE_HOST`     | postgres   | Database hostname            |
| `DATABASE_PORT`     | 5432       | Database port                |
| `DATABASE_USERNAME` | postgres   | Database user                |
| `DATABASE_PASSWORD` | -          | Database password (required) |
| `DATABASE_NAME`     | agam_space | Database name                |
| `HTTP_PORT`         | 3331       | Server port                  |
| `ALLOW_NEW_SIGNUP`  | false      | Allow new user registration  |
| `CORS_ORIGIN`       | \*         | Allowed CORS origins         |

## Reverse Proxy Setup

**Recommended:** Run Agam Space behind a reverse proxy if you're exposing it to
the internet or accessing from multiple devices. The reverse proxy provides
HTTPS encryption and better security.

Choose your reverse proxy:

### Caddy

Create or edit `/etc/caddy/Caddyfile`:

```
files.yourdomain.com {
    reverse_proxy localhost:3331
}
```

Reload Caddy:

```bash
sudo systemctl reload caddy
```

Caddy automatically handles Let's Encrypt certificates.

### Nginx

Create `/etc/nginx/sites-available/agam-space`:

```nginx
server {
    listen 80;
    server_name files.yourdomain.com;

    client_max_body_size 10G;

    location / {
        proxy_pass http://localhost:3331;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        proxy_read_timeout 3600;
        proxy_connect_timeout 3600;
        proxy_send_timeout 3600;
    }
}
```

Enable site:

```bash
sudo ln -s /etc/nginx/sites-available/agam-space /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

Get SSL certificate with Certbot:

```bash
sudo certbot --nginx -d files.yourdomain.com
```

Certbot auto-configures HTTPS and certificate renewal.

## First User Setup

Create your admin account:

1. Open `https://files.yourdomain.com` (or localhost)
2. Click **Sign Up**
3. Enter email and password
4. Set master password
5. Save recovery key

After creating your account, disable signups:

```bash
nano docker-compose.yml
```

Change:

```yaml
ALLOW_NEW_SIGNUP: 'false'
```

Restart:

```bash
docker-compose restart agam
```

## Storage Configuration

### Default Storage

Files stored in `./data/files/` by default.

### Custom Storage Path

To use a different location:

```yaml
volumes:
  - /mnt/storage/agam:/data/files
```

Create directory with correct permissions:

```bash
mkdir -p /mnt/storage/agam
chown -R 1000:1000 /mnt/storage/agam
```

### Storage Structure

```
/data/files/
  u-<userId>/
    f/<fileId>/
      chunk-0
      chunk-1
      ...
```

Each user gets their own directory. Files are split into encrypted chunks.

## Updates

### Update to Latest Version

Pull new image:

```bash
docker-compose pull
```

Restart containers:

```bash
docker-compose up -d
```

Check logs:

```bash
docker-compose logs -f agam
```

### Version Pinning

To pin to specific version, edit `docker-compose.yml`:

```yaml
agam:
  image: agamspace/agam-space:v0.1.0-beta.1
```

## Next Steps

🚀 **[First Steps](./first-steps.md)** - Create admin account and initial setup

💾 **[Set up backups](./backups.md)** - Automate database and file backups
