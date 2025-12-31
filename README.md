# Agam Space

> Self-hosted, **zero-knowledge**, end-to-end encrypted file storage

[![CI](https://github.com/agam-space/agam-space/actions/workflows/ci.yml/badge.svg)](https://github.com/agam-space/agam-space/actions/workflows/ci.yml)
[![Docker](https://img.shields.io/docker/v/agamspace/agam-space?label=docker&sort=semver)](https://hub.docker.com/r/agamspace/agam-space)
[![Release](https://img.shields.io/github/v/release/agam-space/agam-space?include_prereleases&label=version)](https://github.com/agam-space/agam-space/releases)
[![License](https://img.shields.io/badge/license-AGPL--3.0-blue.svg)](./LICENSE)

![Agam Space Dashboard](./docs/static/img/hero.png)

**True zero-knowledge encryption for self-hosted file storage.**

All files and metadata encrypted in your browser before upload. Your master
password never leaves your device. The server stores only encrypted blobs and
cannot decrypt your data - even the server admin cannot access your files.

Think of it as a self-hosted alternative to Mega or Proton Drive, where privacy
is guaranteed by cryptography, not trust.

**About the name:** Agam (அகம்) comes from Tamil language and refers to the
inner, personal world, distinct from what is public. It reflects our commitment
to keeping your data private and encrypted.

## ⚠️ **BETA SOFTWARE - USE WITH CAUTION**

**Agam Space is in early beta and not ready for production use.**

- Bugs and data loss are possible
- Breaking changes may occur between versions
- **Do not use as your only backup**
- Keep copies of important files elsewhere
- Not professionally audited

Once stable, this warning will be removed.

---

## What it does

- Upload and organize files with end-to-end encryption
- Files encrypted in browser before upload (XChaCha20-Poly1305)
- Folder names and metadata also encrypted
- Biometric unlock on trusted devices (Touch ID, Face ID, Windows Hello)
- Web interface (desktop and mobile browsers)
- Self-hosted with Docker

## Documentation

📚 **Full documentation: [docs.agamspace.app](https://docs.agamspace.app)**

Quick links:

- [Installation](https://docs.agamspace.app/installation/docker-compose) -
  Docker setup
- [Configuration](https://docs.agamspace.app/configuration/) - SSO, quotas,
  users
- [Security](https://docs.agamspace.app/security) - How encryption works
- [Architecture](https://docs.agamspace.app/architecture) - Technical details
- [FAQ](https://docs.agamspace.app/faq) - Common questions

## Why I Built This

For a while now, I've wanted to offer file storage to family and friends on my
homelab. But I was always hesitant - I didn't want the ability to access their
files. Even if I wouldn't look, the fact that I _could_ bothered me. They knew
it too, which made them hesitant to use it.

Looking at self-hosted options, true E2EE is surprisingly limited. Nextcloud has
E2EE but with known gaps. Most solutions rely on disk encryption, which only
protects against physical theft - not server compromise or admin access.

Ente Photos showed me this works great for photos - people can actually trust
their homelab admin because the encryption makes it impossible to peek. I wanted
the same for general files.

With over a decade in software development and a strong interest in application
security, I built what I was looking for - a proper zero-knowledge file storage
system where the math guarantees privacy, not just trust.

## Features

**Zero-Knowledge Encryption:**

- Master password never leaves your device
- All encryption happens in your browser (client-side)
- Server stores only encrypted blobs it cannot decrypt
- File names, folder names, and metadata all encrypted
- XChaCha20-Poly1305 authenticated encryption with 256-bit keys
- Argon2id key derivation (memory-hard, GPU-resistant)
- Each file gets unique encryption key derived from folder key hierarchy
- Even the server admin cannot access your data
- Recovery key for emergency access (save it securely!)

**Authentication:**

- Email/password login (separate from master password)
- Optional SSO (Authelia, Authentik, Keycloak, Google, GitHub)
- WebAuthn biometric unlock on trusted devices (Touch ID, Face ID, Windows
  Hello)

**File Management:**

- Upload via drag-and-drop or file picker
- Folder organization (nested folders supported)
- File preview (PDF, images, text, video/audio)
- 30-day trash bin with restore

**Storage:**

- Per-user quotas (default 10GB)
- Chunk-based uploads (resumable)
- Local filesystem storage

## Screenshots

<table>
  <tr>
    <td width="50%">
      <img src="./docs/static/img/features/setup-encryption.png" alt="Encryption Setup" />
      <p align="center"><b>Master Password Setup</b></p>
    </td>
    <td width="50%">
      <img src="./docs/static/img/features/device-unlock.png" alt="WebAuthn" />
      <p align="center"><b>Biometric Device Unlock</b></p>
    </td>
  </tr>
  <tr>
    <td width="50%">
      <img src="./docs/static/img/features/explorer.png" alt="File Explorer" />
      <p align="center"><b>File Explorer</b></p>
    </td>
    <td width="50%">
      <img src="./docs/static/img/features/image-preview.png" alt="File Preview" />
      <p align="center"><b>Image Preview</b></p>
    </td>
  </tr>
</table>

<details>
<summary>📸 More Screenshots</summary>

### Settings & Configuration

![Settings](./docs/static/img/features/settings-encryption.png)

</details>

## Tech Stack

**Docker (Recommended):**

```bash
# Pull from Docker Hub
docker pull agamspace/agam-space:latest

# Or from GitHub Container Registry
docker pull ghcr.io/agam-space/agam-space:latest
```

**Docker Compose:**

Install with Docker Compose:

```bash
mkdir agam-space && cd agam-space

# Create docker-compose.yml (see docs for full config)
curl -o docker-compose.yml https://raw.githubusercontent.com/agam-space/agam-space/main/apps/api-server/docker-compose.yaml

# Start containers
docker-compose up -d
```

Access at http://localhost:3331

For production setup with HTTPS, see the
[Installation Guide](https://docs.agamspace.app/installation/docker-compose).

## Tech Stack

**Backend:**

- NestJS + Fastify
- PostgreSQL + Drizzle ORM
- Local file storage

**Frontend:**

- Next.js 15 + React
- Tailwind CSS
- Zustand (state)

**Crypto:**

- Web Crypto API
- Libsodium (WASM)
- WebAuthn

**Deployment:**

- Docker + Docker Compose
- All-in-one container (API + Web)

## Project Structure

```
agam-space/
├── apps/
│   ├── api-server/    # NestJS backend
│   ├── web/           # Next.js frontend
├── packages/
│   ├── client/        # API client + E2EE logic
│   ├── core/          # Cryptography primitives
│   └── shared-types/  # TypeScript types
└── docs/              # Documentation (Docusaurus)
```

## Development

```bash
# Prerequisites: Node.js 22, pnpm 9

# Install dependencies
pnpm install

# Start all apps
pnpm dev

# Or start individually
pnpm dev:api    # API server (port 3001)
pnpm dev:web    # Web UI (port 3000)
pnpm dev:docs   # Documentation (port 3002)

# Build everything
pnpm build

# Run tests
pnpm test

# Lint and format
pnpm lint
pnpm format
```

## Security

**How it works:**

1. Master password derives Cryptographic Master Key (CMK)
2. CMK encrypts folder keys
3. Folder keys encrypt file keys
4. File keys encrypt file chunks
5. Everything encrypted before upload

**Server sees:**

- Encrypted binary blobs
- File sizes and timestamps
- Folder structure (but not names)

**Server cannot see:**

- File contents
- File names
- Folder names
- Master password or encryption keys

**Not audited** - Personal project for learning. Use at your own risk.

## Roadmap

**Current focus: Stability & Testing**

The project is currently in beta. Before adding major features, the focus is on
stability and reliability.

### Short-term

- **Comprehensive test suite** - Unit, integration, and E2E tests for critical
  paths
- **Bug fixes** - Address issues reported by early users
- **Documentation improvements** - Better guides and troubleshooting

### Next focus

- **File sharing** - Share files/folders with other users
- **Public links** - Share via link with optional expiry
- **Local search** - Search files and folders
- **Encrypted tags** - Organize and search files by tags
- **S3 backend support** - Use object storage instead of local disk

**No timeline commitments.** Features built as time permits. Priorities may
shift based on user feedback.

See [Features](./docs/docs/features.md#planned-features) in documentation for
detailed feature list.

## CI/CD

Automated workflows:

- **CI**: Lint, test, build on PRs to main
- **Docker**: Build and publish on git tags
- **Security**: CodeQL + Trivy scanning
- **Docs**: GitHub Pages deployment (manual trigger)

## Contributing

This is a personal project but contributions welcome. Open an issue first to
discuss changes.

## License

[GNU AGPLv3](./LICENSE)
