---
sidebar_position: 3
---

# Installation

Deploy Agam Space on your infrastructure.

## Installation Methods

Choose how you want to install Agam Space:

📦 **[Docker Compose (Recommended)](./docker-compose.md)** - Easiest way to
deploy Agam Space

## After Installation

Once installed, complete these important steps:

**[First Steps](../configuration/first-steps.md)** - Create admin account and
initial setup

**[Backups](./backups.md)** - Set up automated backups (critical!)

## Requirements

- Docker and Docker Compose
- 512MB RAM minimum
- 1 CPU core
- Storage space for your files + database
- Domain name (optional, for HTTPS)
- Reverse proxy for HTTPS (Caddy, Nginx, Traefik, etc.)

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

## Security Considerations

- Use HTTPS (reverse proxy required)
- Strong database password
- Regular backups

## Getting Help

Check [FAQ](../faq.md) for common questions.
