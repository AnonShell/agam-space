# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## Versioning Strategy

**Git tags are the source of truth for versions.** Package.json files do not
contain version numbers.

Example: Tag `v0.1.0-beta.1` → Docker image `0.1.0-beta.1`

---

## [Unreleased]

### Added

- Initial beta release features

### Changed

- N/A

### Fixed

- N/A

## [0.1.0-beta.1] - 2024-12-20

### Added

- End-to-end encryption with XChaCha20-Poly1305
- WebAuthn support for passwordless device unlock
- File upload and download with encryption
- Folder management with encrypted metadata
- Web interface built with Next.js 15
- REST API built with NestJS and Fastify
- PostgreSQL database with Drizzle ORM
- Docker support with multi-platform builds
- TypeScript monorepo with pnpm workspaces
- Client library for E2EE operations
- Cryptography core package
- Shared types across packages
- CI/CD pipeline with GitHub Actions
- Automated Docker image publishing

### Security

- Client-side encryption before data leaves the browser
- Zero-knowledge architecture
- Argon2 key derivation
- WebAuthn for secure device unlock

[Unreleased]:
  https://github.com/yourusername/agam-space/compare/v0.1.0-beta.1...HEAD
[0.1.0-beta.1]:
  https://github.com/yourusername/agam-space/releases/tag/v0.1.0-beta.1
