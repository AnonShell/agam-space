# Agam Space

> Self-hosted, end-to-end encrypted file storage platform

## Overview

Agam Space is a privacy-focused file storage solution that puts security first.
All files, metadata, and tags are encrypted client-side before being stored on
your own infrastructure.

## Key Features

- 🔒 **End-to-End Encryption**
  - Zero-knowledge architecture
  - Modern cryptography (XChaCha20-Poly1305)
  - Client-side encryption of all data

- 🖥️ **Self-Hosted**
  - Run on your own infrastructure
  - Simple Docker Compose deployment
  - Lightweight and efficient

- 💻 **Cross-Platform**
  - Responsive web interface
  - CLI tools for automation
  - Mobile-friendly design

## Quick Start

1. Clone the repository
2. Copy and configure `.env` from `.env.example`
3. Run with Docker Compose:

```bash
docker-compose up -d
```

## Tech Stack

- **Backend**: NestJS, Fastify, PostgreSQL
- **Frontend**: Next.js 14, Tailwind CSS
- **Storage**: Local filesystem (S3-compatible storage planned)
- **Security**: WebCrypto, Libsodium
- **Build**: pnpm, TypeScript

## Development

```bash
# Install dependencies
pnpm install

# Start development servers
pnpm dev

# Build for production
pnpm build
```

## Security

- Client Master Key (CMK) is the root of trust
- All encryption/decryption happens client-side
- Server never sees unencrypted data
- Optional recovery key for backup

## License

Agam Space is licensed under the [GNU AGPLv3](./LICENSE) license.

---

Built for privacy-first, self-hosted simplicity
