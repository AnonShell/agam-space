---
sidebar_position: 1
slug: /
---

# Introduction

![Agam Space](../static/img/hero.png)

Agam Space is a self-hosted, end-to-end encrypted file storage platform. All
files and metadata are encrypted on your device before upload. The server stores
only encrypted data and cannot access your files or encryption keys.

Built for users who want control over their data without sacrificing privacy.

**About the name:** Agam (அகம்) is Tamil for "inner" or "heart." In classical
literature, it represents the private, inner world - fitting for a platform
where your data remains private and encrypted.

## Current status

:::danger Early Development Warning

Agam Space is in early beta and **not ready for production use**. Bugs and data
loss are possible.

**Do not use as your only backup.** Keep copies of important files elsewhere.
Once stable, this warning will be removed.

:::

Agam Space is in **beta** (v0.1.0) and under active development. Core features
work but expect bugs and breaking changes.

**What works:**

- File upload/download with encryption
- Folder organization
- File previews (PDF, images, text)
- Text file editing
- Trash bin (30-day auto-delete)
- WebAuthn device unlock
- Storage quota enforcement

**Known limitations:**

- No file sharing between users
- No mobile apps (web UI is responsive)
- No file versioning
- Local storage only (no S3 yet)

## Why Agam Space?

**The E2EE gap in self-hosted storage**

True end-to-end encryption is rare in the self-hosted space. Nextcloud has E2EE
but with known limitations. Most other popular solutions (ownCloud, FileRun,
Pydio) don't offer it at all.

The usual workaround? Full-disk encryption on the server. But that only protects
against physical theft - not compromised servers, rogue admins, or anyone with
root access. Your files are still readable to anyone who can access the running
system.

**Personal motivation**

With over a decade in software development and a strong interest in application
security and architecture, I wanted to build something real. Learn by doing.
Explore modern E2EE patterns properly. Have fun solving hard problems.

**Sharing with family and friends**

I've always wanted to offer file storage to family and friends on my homelab,
but hesitated. Without true privacy, it felt wrong - I could technically access
their files. They knew it too, which made them hesitant to use it.

Projects like Ente Photos showed this works - you can run a service for people
you care about while respecting their privacy. That motivated me to build Agam
Space. Now I can offer storage to family and friends where even I can't read
their files.

**Bottom line:** Personal project for learning and sharing with people I trust.

## What Agam Space is NOT

**Not a photo backup solution**  
Looking for E2EE photo storage? Check out [Ente](https://ente.io) -
purpose-built for photos with mobile apps, face recognition, and automatic
backups. It's awesome.

**Not a feature-rich file browser**  
Need advanced file management, media streaming, or extensive integrations? Try
[Filebrowser](https://filebrowser.org), [FileGator](https://filegator.io), or
similar tools. They're excellent for general file browsing without the
encryption overhead.

Agam Space fills a specific niche: self-hosted E2EE file storage for people who
want privacy without cloud services.

## How it works

1. **Sign up** - First user becomes admin
2. **Set master password** - Creates your encryption key (CMK)
3. **Save recovery key** - One-time backup to recover your CMK
4. **Upload files** - Encrypted in browser before upload
5. **Access anywhere** - Unlock with master password or biometric on trusted
   devices

Your master password never leaves your device. The server only sees encrypted
data.

## Architecture

- **Frontend**: Next.js (React) with Web Crypto API for encryption
- **Backend**: NestJS with PostgreSQL
- **Storage**: Local filesystem (configurable path)
- **Deployment**: Docker Compose

Built as a monorepo with TypeScript throughout.

## Next steps

✨ **[Features](./features.md)** - What Agam Space can do

🚀 **[Quick Start](./quick-start.md)** - Get running in 5 minutes

📖 **[Installation](./installation.md)** - Production setup guide

🔒 **[Security](./security.md)** - How encryption works

🏗️ **[Architecture](./architecture.md)** - Technical deep dive
