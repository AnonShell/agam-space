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

:::tip

Docker Registry Options Agam Space images are published to both:

- **Docker Hub:** `agamspace/agam-space:latest`
- **GitHub Container Registry:** `ghcr.io/agam-space/agam-space:latest`

Use either registry in the `image:` field below.

:::

### Docker Tags

Multiple image tags are available:

| Tag      | Description                                    |
| -------- | ---------------------------------------------- |
| `latest` | Latest stable release                          |
| `v0.2.0` | Specific version (example)                     |
| `dev`    | Development builds from main branch (unstable) |

**Multi-arch support:** All images support both `amd64` and `arm64`
architectures.

### Configuration

Create `docker-compose.yml` with the following content:

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
    image: agamspace/agam-space:latest
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
    volumes:
      - ./data:/data
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

See **[Configuration Guide](../configuration/index.md)** for complete details on
configuring Agam Space.

Quick reference of essential variables:

| Variable            | Required | Default    | Description                 |
| ------------------- | -------- | ---------- | --------------------------- |
| `DATABASE_HOST`     | ✅       | -          | Database hostname           |
| `DATABASE_USERNAME` | ✅       | -          | Database user               |
| `DATABASE_PASSWORD` | ✅       | -          | Database password           |
| `DATABASE_NAME`     | No       | agam_space | Database name               |
| `HTTP_PORT`         | No       | 3331       | Server port                 |
| `ALLOW_NEW_SIGNUP`  | No       | true       | Allow new user registration |

## Reverse Proxy Setup

**Recommended:** Run Agam Space behind a reverse proxy if you're exposing it to
the internet or accessing from multiple devices. The reverse proxy provides
HTTPS encryption and better security.

Choose your reverse proxy:

**Example Caddy config:**

```
files.yourdomain.com {
    reverse_proxy localhost:3331
}
```

**Example Nginx config:**

```nginx
server {
    server_name files.yourdomain.com;
    client_max_body_size 10G;

    location / {
        proxy_pass http://localhost:3331;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Configure SSL certificates with your reverse proxy of choice.

## Storage Configuration

### File Permissions

Container runs as root by default.

**Optional: Run as specific user**

```yaml
agam:
  environment:
    PUID: 1000 # Your user ID (run `id -u`)
    PGID: 1000 # Your group ID (run `id -g`)
```

If PUID/PGID don't match your `/data` directory ownership, container fails with
an error. Fix by changing directory ownership:

```bash
sudo chown -R 1000:1000 ./data
```

### Default Storage

Files stored in `/data/files/` (maps to `./data/files/` on host).

Other directories:

- `/data/config` - Configuration
- `/data/logs` - Logs
- `/data/cache` - Cache

### Custom Storage Path

```yaml
agam:
  volumes:
    - /mnt/storage/agam:/data
```

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

To pin to specific version:

```yaml
agam:
  image: agamspace/agam-space:v0.2.0
```

## Next Steps

🚀 **[First Steps](../configuration/first-steps.md)** - Create admin account and
initial setup

💾 **[Set up backups](./backups.md)** - Automate database and file backups
