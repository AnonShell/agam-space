---
sidebar_position: 3
---

# Installation

Deploy Agam Space on your infrastructure.

## Installation Methods

Choose how you want to install Agam Space:

📦 **[Docker Compose (Recommended)](./docker-compose.md)** - Easiest way to
deploy Agam Space

Coming soon:

- Kubernetes deployment
- Native installation
- Platform-specific packages

## After Installation

Once installed, complete these important steps:

💾 **[Backups](./backups.md)** - Set up automated backups (critical!)

🚀 **[First Steps](../configuration/first-steps.md)** - Create admin account and
initial setup

## Requirements

**Minimum:**

- Docker and Docker Compose
- Linux server (Ubuntu 22.04+ recommended)
- Domain name (optional, for HTTPS)

**Recommended:**

- Reverse proxy (Caddy or Nginx) for HTTPS
- Dedicated server or VPS
- Regular backup storage

## Quick Overview

Typical installation flow:

1. **Install** - Set up Docker Compose
2. **Configure** - Set environment variables
3. **Deploy** - Start containers
4. **Reverse Proxy** - Configure HTTPS (optional but recommended)
5. **Backups** - Automate database and file backups
6. **First User** - Create admin account
7. **Secure** - Disable signups, set CORS

Detailed steps in each installation guide.

## Storage Planning

Files are stored in chunks on disk:

```
/data/files/
  u-<userId>/
    f/<fileId>/
      chunk-0
      chunk-1
      ...
```

**Estimate storage needs:**

- PostgreSQL database: ~100MB + (users × 10MB)
- File storage: Depends on user quotas (default 10GB per user)
- Backup storage: 2× file storage (database + files)

**Example:**

- 5 users with 10GB quota each
- Database: ~150MB
- File storage: ~50GB
- Backup storage: ~100GB
- **Total: ~150GB**

## Deployment Options

**Home server:**

- Raspberry Pi 4 (4GB+) works
- NAS with Docker support
- Old PC/laptop repurposed

**VPS/Cloud:**

- DigitalOcean, Linode, Hetzner
- AWS EC2, Google Cloud
- Oracle Cloud (free tier available)

**Recommended specs:**

- 2 CPU cores
- 4GB RAM
- 50GB+ storage (depends on users)

## Security Considerations

Before exposing to internet:

- Use HTTPS (reverse proxy required)
- Strong database password
- Firewall configured (only 80/443 open)
- Regular updates
- Automated backups

See installation guides for detailed security setup.

## Getting Help

- Follow [Docker Compose guide](./docker-compose.md) for step-by-step
  instructions
- Check [FAQ](../faq.md) for common questions
- Review [Quick Start](../quick-start.md) for quick testing
