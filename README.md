# Agam Space

> Self-hosted, end-to-end encrypted file storage platform

[![CI](https://github.com/yourusername/agam-space/actions/workflows/ci.yml/badge.svg)](https://github.com/yourusername/agam-space/actions/workflows/ci.yml)
[![Docker](https://img.shields.io/docker/v/yourusername/agam-space?label=docker&sort=semver)](https://hub.docker.com/r/yourusername/agam-space)
[![Release](https://img.shields.io/github/v/release/yourusername/agam-space?include_prereleases&label=version)](https://github.com/yourusername/agam-space/releases)
[![License](https://img.shields.io/badge/license-AGPL--3.0-blue.svg)](./LICENSE)

Agam Space is a privacy-focused file storage solution that puts security first.
All files, folders, and metadata are encrypted client-side before being stored
on your own infrastructure.

## Key Features

- 🔒 **End-to-End Encryption** - Zero-knowledge architecture with client-side
  encryption
- 🖥️ **Self-Hosted** - Run on your own infrastructure with Docker
- 💻 **Cross-Platform** - Web interface, CLI tools, and mobile-friendly design
- 🔐 **Modern Cryptography** - XChaCha20-Poly1305, WebAuthn, Argon2
- 🚀 **Fast & Lightweight** - Built with performance in mind

## Quick Start

```bash
# Clone the repository
git clone https://github.com/yourusername/agam-space.git
cd agam-space

# Install dependencies
pnpm install

# Start development servers
pnpm dev
```

For detailed installation, configuration, and deployment instructions, see the
[Documentation](https://yourusername.github.io/agam-space) (coming soon).

## Tech Stack

- **Backend**: NestJS, Fastify, PostgreSQL, Drizzle ORM
- **Frontend**: Next.js 15, React, Tailwind CSS, Zustand
- **Packages**: TypeScript monorepo with pnpm workspaces
- **Security**: WebCrypto API, Libsodium (WASM), WebAuthn
- **E2EE**: Client-side encryption with zero-knowledge architecture

## Project Structure

```
agam-space/
├── apps/
│   ├── api-server/    # Backend API (NestJS)
│   ├── web/           # Web UI (Next.js)
├── packages/
│   ├── client/        # Client library (API + E2EE)
│   ├── core/          # Cryptography core
│   └── shared-types/  # Shared TypeScript types
└── docs/              # Documentation site (Docusaurus)
```

## Development

```bash
# Install dependencies
pnpm install

# Start all apps in development mode
pnpm dev

# Run specific app
pnpm dev:api    # API server
pnpm dev:web    # Web interface

# Build for production
pnpm build

# Run tests
pnpm test

# Lint and format
pnpm lint
pnpm format
```

## CI/CD & Security

This project includes automated workflows for quality and security:

- ✅ **Automated Testing** - Lint, format, type-check on every PR
- ✅ **Docker Build Validation** - Prevents broken builds from reaching main
- ✅ **Security Scanning** - CodeQL for code + Trivy for Docker images
- ✅ **Dependency Updates** - Dependabot keeps dependencies up-to-date
- ✅ **Automated Releases** - Tag-based releases with changelog

See [CI/CD Documentation](.github/workflows/README.md) for details.

## Security

- **Client Master Key (CMK)** is the root of trust, derived from user password
- All encryption/decryption happens **client-side only**
- Server **never sees** unencrypted data or encryption keys
- Optional recovery key for account backup
- WebAuthn support for passwordless device unlock

## Contributing

Contributions are welcome! Please read our contributing guidelines (coming soon)
before submitting PRs.

## License

Agam Space is licensed under the [GNU AGPLv3](./LICENSE) license.

---

**Built for privacy, security, and self-sovereignty**
