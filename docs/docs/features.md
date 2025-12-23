---
sidebar_position: 2
---

# Features

What Agam Space can do.

## Screenshots

<table>
  <tr>
    <td width="50%">
      <img src="/img/features/explorer.png" alt="File Explorer" />
      <p align="center"><b>File Explorer</b></p>
    </td>
    <td width="50%">
      <img src="/img/features/image-preview.png" alt="Image Preview" />
      <p align="center"><b>Image Preview</b></p>
    </td>
  </tr>
  <tr>
    <td width="50%">
      <img src="/img/features/setup-encryption.png" alt="Encryption Setup" />
      <p align="center"><b>Master Password Setup</b></p>
    </td>
    <td width="50%">
      <img src="/img/features/device-unlock.png" alt="Device Unlock" />
      <p align="center"><b>Biometric Device Unlock</b></p>
    </td>
  </tr>
<tr>
    <td width="50%">
      <img src="/img/features/settings-encryption.png" alt="Settings Encryption" />
      <p align="center"><b>Settings - Encryption</b></p>
    </td>
</tr>
</table>

---

## Encryption

**End-to-end encrypted**  
Everything is encrypted on your device before upload - files, folder names,
tags, metadata. Uses XChaCha20-Poly1305 (AEAD cipher) with 256-bit keys.

**Master password is the root of trust**  
Your master password generates your Cryptographic Master Key (CMK) using
Argon2id. This CMK is the foundation of your encryption - it derives all other
keys. Without your master password (or recovery key), your data is
mathematically unrecoverable. Even we can't help you.

**Key hierarchy**  
Each folder gets its own encryption key (derived from CMK or parent folder key).
Each file gets its own unique encryption key (derived from folder key). This
layered approach enables future features like secure sharing while keeping
everything encrypted.

```
Master Password (your memory)
    ↓ (Argon2id)
Cryptographic Master Key (CMK)
    ↓
Root Folder Key
    ↓
  Subfolder Key
      ↓
    File Encryption Key (FEK)
        ↓
      Encrypted Chunks
```

Without the master password, the entire chain breaks - no keys can be derived,
no data can be decrypted.

**Zero-knowledge architecture**  
Server stores only encrypted data. Your encryption keys never leave your device.
The server operator (even if it's you) cannot decrypt your files without your
master password.

**Recovery key**  
Generated during setup as a backup to decrypt your CMK. Accessible anytime in
Settings. Save it somewhere safe - it's your last resort if you forget your
master password.

## Authentication

**Login**  
Email and password authentication. Optional SSO support (Authelia, PocketID,
etc.) if configured. First user becomes admin.

**Master password unlock**  
After login, you must unlock with your master password to decrypt your CMK. This
happens once per session - your login password and master password are separate
(recommended for security).

**Biometric unlock (trusted devices)**  
Register devices using WebAuthn (Touch ID, Face ID, Windows Hello). On
registered devices, unlock with biometrics instead of typing master password.
Your CMK is encrypted with device-specific keys stored in hardware secure
enclave.

**Session management**  
Sessions persist across page reloads (encrypted CMK in sessionStorage).
15-minute inactivity timeout. Sessions clear on tab close or logout.

**Multi-user support**  
Multiple users with separate encrypted storage. Each user has their own CMK -
users cannot access each other's files.

## File Management

**Upload**

- Chunk-based upload (5MB chunks by default, configurable)
- Each chunk encrypted separately with unique nonce
- Resumable uploads - restart from last successful chunk
- Parallel chunk encryption in browser
- Real-time progress tracking
- Drag-and-drop or file picker
- Folder upload (maintains structure)

**Server-side storage structure**  
Files aren't stored as single blobs. Each file is split into encrypted chunks:

```
/data/files/
  u-<userId>/
    f/<fileId>/
      chunk-0
      chunk-1
      chunk-2
      ...
```

Each chunk is an encrypted binary file. Without the encryption keys, chunks are
just random data. This structure enables efficient streaming and resumable
uploads.

**Download**

- Chunks fetched and decrypted in browser
- Reassembled into original file
- Single file or bulk download
- Original filenames preserved

**Organization**

- Nested folders (unlimited depth)
- Move files/folders between locations
- Rename files and folders
- Multi-select operations

**Preview**

- PDF viewer
- Image viewer (JPEG, PNG, GIF, WebP)
- Text file viewer with syntax highlighting
- Edit text files inline

**Trash**

- 30-day retention before permanent deletion
- Restore deleted items
- Empty trash manually
- Auto-cleanup job

## Storage

**Quotas**

- Per-user storage limits
- Real-time usage tracking
- Configurable (including unlimited)
- Upload blocked when quota exceeded

**Local storage**

- Files stored on server filesystem
- Configurable storage path
- S3 backend planned

## Deployment

**Docker-based**

- Docker Compose setup
- Single container deployment
- PostgreSQL database
- Easy updates

**Self-hosted**

- Run on your own infrastructure
- Full data control
- No vendor lock-in

## Platforms

**Web (current)**

- Responsive UI (desktop, tablet, mobile)
- Works in any modern browser
- No installation needed

## Planned features

**Current focus: Stability & Testing**

Before adding new features, focus is on making the project stable and reliable:

- Comprehensive test suite (unit, integration, E2E)
- Bug fixes from early users
- Documentation improvements

**Next focus:**

- **File sharing** - Share files/folders with other users
- **Public links** - Share via link with optional expiry
- **Local search** - Search files and folders
- **Encrypted tags** - Organize and search files by tags
- **S3 backend** - Use object storage instead of local disk

No timeline commitments. Features built as time permits.
