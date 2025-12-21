---
sidebar_position: 5
---

# Architecture

Overview of Agam Space's system architecture and design decisions.

## System Overview

Agam Space consists of three main components that work together to provide
encrypted file storage:

```
┌─────────────┐
│  Web Client │
│  (React)    │
└──────┬──────┘
       │ HTTPS/REST
       │
┌──────▼──────┐      ┌──────────────┐
│ API Server  │◄─────┤  PostgreSQL  │
│  (NestJS)   │      │   Database   │
└──────┬──────┘      └──────────────┘
       │
       │
┌──────▼──────┐
│   Storage   │
│ (Local/S3)  │
└─────────────┘
```

**Web Client** - React application that handles all encryption/decryption
client-side  
**API Server** - NestJS backend that manages authentication, metadata, and
encrypted file storage  
**PostgreSQL** - Database for user accounts, metadata, and encrypted folder/file
information  
**Storage** - File system or S3-compatible storage for encrypted file chunks

## Technology Stack

### Backend

- **Framework**: NestJS with Fastify
- **Language**: TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Passport.js (Local + SSO via OIDC)
- **Storage**: Local filesystem (S3 support planned)

### Frontend

- **Framework**: React with Next.js 14
- **Language**: TypeScript
- **Styling**: Tailwind CSS with shadcn/ui components
- **State Management**: Zustand
- **Encryption**: WebCrypto API

## Encryption Architecture

All encryption happens client-side. The server never has access to plaintext
data or encryption keys.

### Key Hierarchy

```
Master Password (user input)
    │
    ▼ Argon2id KDF
Cryptographic Master Key (CMK)
    │
    ├─► Folder Key (per folder, encrypted with CMK or parent key)
    │       │
    │       └─► File Encryption Key (FEK, per file)
    │               │
    │               └─► Encrypted File Chunks
    │
    ├─► Recovery Key (optional, can decrypt CMK)
    │
    └─► Device Keys (X25519 keypair for WebAuthn unlock)
```

### Encryption Primitives

**Symmetric encryption**: XChaCha20-Poly1305  
**Key derivation**: Argon2id  
**Asymmetric crypto**: X25519 (device unlock, future sharing)  
**Hashing**: SHA-256

### What Gets Encrypted

Client-side before upload:

- File contents (chunked, each chunk encrypted separately)
- File names
- Folder names
- Tags and custom metadata
- File MIME types

Server stores only:

- Encrypted blobs
- Folder hierarchy (IDs and parent relationships)
- User accounts and roles
- Upload timestamps
- Storage quotas and usage

## Authentication Flow

### Local Authentication

```
1. User enters email + password
2. Server verifies credentials
3. Server issues session token
4. Client prompts for master password
5. Client derives CMK from master password (Argon2id)
6. CMK stored in memory/sessionStorage (never sent to server)
```

### SSO/OIDC Flow

```
1. User clicks "Login with Google/GitHub"
2. Redirect to OIDC provider
3. Provider authenticates user
4. Callback with authorization code
5. Server exchanges code for tokens
6. Server creates/links user account
7. Session issued
8. Client prompts for master password (as above)
```

### Device Unlock (WebAuthn)

```
1. User registers device (Touch ID/Face ID/Windows Hello)
2. WebAuthn generates device keypair
3. CMK encrypted with device public key
4. On subsequent logins: WebAuthn challenge
5. Device private key decrypts CMK
6. User unlocked without typing master password
```

## File Upload Flow

```
1. User selects file(s) in web UI
2. Client generates random FEK (File Encryption Key)
3. Client encrypts FEK with Folder Key
4. Client chunks file (default 5MB chunks)
5. Each chunk encrypted with FEK using XChaCha20-Poly1305
6. Client uploads encrypted chunks to server
7. Server stores chunks without decrypting
8. Server stores encrypted metadata (filename, FEK)
9. Upload marked complete after all chunks uploaded
```

Uploads are resumable. If interrupted, the client can resume from the last
successful chunk.

## File Download Flow

```
1. User requests file download
2. Client fetches encrypted metadata from server
3. Client decrypts FEK using Folder Key
4. Server streams encrypted chunks
5. Client decrypts each chunk with FEK
6. Decrypted data assembled in browser
7. File saved or displayed to user
```

For media files (video/audio), decryption happens on-the-fly using the
MediaSource API for streaming playback.

## Database Schema

### Key Tables

**users** - User accounts, roles, encrypted CMK wrapper  
**sessions** - Active user sessions  
**folders** - Folder metadata (encrypted names, parent relationships)  
**files** - File metadata (encrypted names, size, chunks)  
**chunks** - Individual file chunks (encrypted blob references)  
**device_keys** - WebAuthn device credentials  
**storage_quota** - Per-user storage limits and usage

All sensitive metadata (names, tags) stored encrypted in JSONB columns.

## Folder Structure

Folders form a tree:

- Root folder per user (ID = null means root)
- Each folder has parent_id pointing to parent
- Folder keys encrypted with parent folder key or CMK
- Efficient traversal via recursive queries

## Deployment Architecture

### Development

```
┌─────────────┐
│  Next.js    │ :3000
│  Dev Server │
└─────────────┘

┌─────────────┐
│  NestJS     │ :3331
│  Dev Server │
└─────────────┘

┌─────────────┐
│ PostgreSQL  │ :5432
└─────────────┘
```

### Production (Docker Compose)

```
        ┌────────────────┐
        │ Reverse Proxy  │
        │ (Nginx/Caddy)  │
        │   Port 443     │
        └────────┬───────┘
                 │
        ┌────────▼────────┐
        │  Agam Space API │
        │   (Container)   │
        │   Port 3331     │
        └────────┬────────┘
                 │
        ┌────────▼────────┐
        │   PostgreSQL    │
        │   (Container)   │
        └─────────────────┘
```

## Performance

### Optimizations

- Chunked uploads enable resumability and parallel transfer
- Lazy folder loading (fetch children on demand)
- Client-side caching of folder structures
- PostgreSQL connection pooling
- Encrypted chunk deduplication (planned)

### Scalability

Current implementation tested with:

- Single server deployment
- Up to 100GB per user
- Thousands of files per folder

Planned improvements:

- S3-compatible storage backend
- Horizontal scaling of API servers
- CDN for static assets
- Database read replicas

## Development Setup

See the repository README for local development setup instructions.

Key commands:

```bash
# Install dependencies
pnpm install

# Start dev servers
pnpm dev

# Run tests
pnpm test

# Build for production
pnpm build
```

## Contributing

Architecture decisions and major changes should be discussed in GitHub issues
before implementation. See CONTRIBUTING.md for guidelines.
