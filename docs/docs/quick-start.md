---
sidebar_position: 2
---

# Quick Start

Get Agam Space running in 5 minutes.

## Prerequisites

Docker and Docker Compose installed.

## Setup

Create a directory for Agam Space:

```bash
mkdir agam-space && cd agam-space
```

Create `docker-compose.yml`:

:::info The `agam` image is all-in-one - includes both the backend API and web
application in a single container. :::

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: changeme
      POSTGRES_DB: agam_space
    volumes:
      - ./postgres-data:/var/lib/postgresql/data
    restart: unless-stopped

  agam:
    # Available from Docker Hub or GHCR:
    # Docker Hub: agamspace/agam-space:latest
    # GHCR: ghcr.io/agam-space/agam-space:latest
    image: agamspace/agam-space:latest
    ports:
      - '3331:3331'
    environment:
      DATABASE_HOST: postgres
      DATABASE_PORT: 5432
      DATABASE_USERNAME: postgres
      DATABASE_PASSWORD: changeme
      DATABASE_NAME: agam_space
      HTTP_PORT: 3331
      ALLOW_NEW_SIGNUP: 'true'
    volumes:
      - ./files:/data # storage location
    depends_on:
      - postgres
    restart: unless-stopped
```

Start containers:

```bash
docker-compose up -d
```

## First login

1. Open http://localhost:3331
2. Click **Sign Up** (first user becomes admin)
3. Enter email and password (SSO login also available if configured)
4. Set your **master password** (encrypts your files)
5. **Save the recovery key** - displayed during setup (also accessible later in
   Settings)
6. Done! Upload files

## Disable signups

After creating your account, if you want, you can disable new registrations to
prevent anyone else from signing up.

Edit `docker-compose.yml`, change:

```yaml
ALLOW_NEW_SIGNUP: 'false'
```

Restart:

```bash
docker-compose up -d
```

You can re-enable it later if you want to invite others.

## Access from other devices

Replace `localhost` with your server's IP address or domain name.

For HTTPS and external access, see
[Installation](./installation.md#reverse-proxy).

## Storage location

Files are stored in `./files/` directory. Back this up regularly.

Database is in `./postgres-data/`.

## Next steps

📖 **[Installation guide](./installation.md)** - Production setup with HTTPS and
reverse proxy

🔒 **[Security overview](./security.md)** - How encryption works and threat
model

✨ **[Features](./features.md)** - What Agam Space can do
