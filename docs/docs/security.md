---
sidebar_position: 5
---

# Security

How Agam Space protects your data with zero-knowledge encryption. This guide
explains the security model, privacy guarantees, and limitations for users and
security auditors.

**For technical implementation details, see [Architecture](./architecture.md).**

## Zero-knowledge Architecture

Agam Space is built on **zero-knowledge** principles. This means:

**The server cannot decrypt your data**

- All encryption happens in your browser before upload
- Your master password never leaves your device
- The server stores only your encrypted CMK (which it cannot decrypt)
- File contents, names, folder names, and metadata are encrypted client-side
- Even the server administrator cannot access your files

**What "zero-knowledge" guarantees:**

- ✅ Server compromise? Your data stays encrypted
- ✅ Database leak? Only encrypted blobs are exposed
- ✅ Malicious admin? Cannot read your files
- ✅ Stolen backups? Still encrypted
- ✅ Legal seizure? Nothing to decrypt without your password

**The trade-off:**

- ❌ If you lose your master password AND recovery key, your data is permanently
  unrecoverable
- ❌ No password reset via email (by design - that would break zero-knowledge)
- ❌ Server admin cannot help recover your password (and that's the point)

This is cryptographic privacy, not just trust. The math makes it impossible for
anyone without your password to access your data.

## What the server knows (and doesn't know)

Understanding what the server can and cannot access:

**What the server stores:**

- Encrypted CMK (wrapped with password-derived key) - **cannot decrypt**
- Encrypted file chunks (binary blobs) - **cannot decrypt**
- Encrypted folder/file metadata - **cannot decrypt**
- File sizes and timestamps (needed for quota management)
- User emails and login credentials (for authentication)

**What the server CANNOT access:**

- ✗ Your master password (never sent to server)
- ✗ Decrypted CMK (only has encrypted version)
- ✗ File contents
- ✗ File names or folder names
- ✗ Any metadata (MIME types, tags, etc.)

**Key guarantee:** Even with full database access, the server operator (or
someone who compromises it) cannot decrypt your data without your master
password.

For technical implementation details, see
[Architecture](./architecture#encryption-architecture).

## How zero-knowledge encryption works

### Key hierarchy

```
Master Password (you remember this)
        ↓
Cryptographic Master Key (CMK) - derived with Argon2id
        ↓
Folder Keys - one per folder
        ↓
File Encryption Keys - one per file
        ↓
Encrypted File Chunks
```

### Algorithms used

- **File encryption**: XChaCha20-Poly1305 (AEAD cipher)
- **Key derivation**: Argon2id (memory-hard, GPU-resistant)
- **Device keys**: X25519 (elliptic curve Diffie-Hellman)
- **Hashing**: SHA-256

Industry-standard cryptography. No custom crypto.

### What gets encrypted

**Encrypted:**

- File contents
- File names
- Folder names
- MIME types
- Tags and metadata

**Not encrypted:**

- User email
- File sizes (needed for quotas)
- Upload timestamps
- Folder structure (which folder contains what, but not names)

This minimal metadata allows quota enforcement and folder navigation without
accessing your content.

### Example: How files are actually stored

Let's say you upload `Documents/passport.pdf`:

**What you see:**

```
My Files/
  Documents/
    passport.pdf
```

**What's stored on server:**

```
/data/files/
  u-a1b2c3d4/                    ← User ID (visible)
    f/e5f6g7h8/                  ← File ID (visible, random)
      chunk-0                     ← Encrypted chunk (binary data)
      chunk-1                     ← Encrypted chunk (binary data)
      chunk-2                     ← Encrypted chunk (binary data)
```

**Database stores:**

- File ID: `e5f6g7h8` (visible)
- Encrypted filename: `xk9mP2...encrypted blob...` (server can't read
  "passport.pdf")
- Encrypted folder name: `7hQ3z...encrypted blob...` (server can't read
  "Documents")
- File size: `2.4 MB` (visible, needed for quota)
- Upload time: `2024-12-21` (visible)
- Encrypted file key: `wrapped with folder key` (server can't decrypt)

Without your master password, the server sees:

- Random file IDs
- Encrypted binary chunks
- File sizes and timestamps
- **Cannot see:** Folder names, file names, or file contents

## Authentication

### Two separate passwords (recommended)

For maximum security, use different passwords:

1. **Login password** - Stored as Argon2id hash on server, used for
   authentication
2. **Master password** - Never sent to server, used only in your browser to
   decrypt your CMK

If someone steals the server database, they get login password hashes but your
encrypted data remains secure because they don't have your master password.

### Login flow

1. Enter email and login password
2. Server verifies credentials (checks Argon2id hash stored in database)
3. Server sends encrypted CMK material to browser (server cannot decrypt this)
4. Browser prompts for master password (never sent to server)
5. Browser derives CMK from master password using Argon2id (client-side only)
6. CMK unlocked in browser memory for session

**Key point:** The server never sees your master password. All CMK derivation
happens in your browser.

### Session security

- Sessions expire after 15 minutes of inactivity (client-side timeout)
- CMK stored in browser memory during session
- CMK persisted in sessionStorage (base64 encoded) for convenience across page
  reloads
- SessionStorage cleared on tab close or explicit logout
- HTTPS required for production (use reverse proxy)

**Security note:** The CMK in sessionStorage is base64 encoded for
serialization, not encrypted. This is a UX trade-off - it allows the app to work
across page reloads without re-entering your master password. The alternative is
re-authentication on every page reload. SessionStorage is accessible to
JavaScript in the same origin, so the security model relies on preventing
malicious code from running (CSP headers, HTTPS, code auditing).

**Important caveat:** The CMK alone is not sufficient to access your data. Even
if someone obtains your CMK from sessionStorage (via XSS or device theft), they
cannot make API requests without a valid session token issued by the server.
Every API request requires server-side session validation - the server checks
that your session is valid and hasn't expired. This means:

- CMK stolen from sessionStorage → Cannot access your files without valid
  session
- XSS attack → Still needs to bypass server session validation

**Additional security layer being explored:** We're actively looking for better
ways to secure the CMK in sessionStorage while maintaining UX convenience - such
as encrypting it with a WebAuthn-derived key. Until a more secure solution is
implemented, this feature could be placed behind a feature flag if needed,
allowing users to choose between convenience (sessionStorage persistence) or
maximum security (re-authentication on every page reload).

### Trusted devices (WebAuthn)

Register devices (laptop, phone) for biometric unlock:

1. Unlock with master password once
2. Register device with Touch ID/Face ID/Windows Hello
3. Future logins: biometric unlock instead of typing password

**How it works:**

- WebAuthn creates hardware-backed key pair
- Private key stays in device secure enclave
- CMK encrypted with device public key
- Biometric proves you own the device, decrypts CMK

Convenient without sacrificing security. Each device gets its own key pair.

## Recovery key

During setup, a recovery key is generated:

- 256-bit random key
- Can decrypt your CMK if you forget master password
- **Displayed during setup** - save it securely
- Also accessible later in Settings
- Server doesn't store it unencrypted

**Save your recovery key:**

- Write it down on paper
- Store in password manager
- Keep in safe deposit box
- Don't lose it

Without master password OR recovery key, your data is gone forever.

## File upload/download

### Upload

1. File split into chunks (5MB default)
2. Generate random file encryption key (FEK)
3. Encrypt FEK with folder key
4. Encrypt each chunk with FEK + unique nonce
5. Upload encrypted chunks
6. Server stores encrypted data, never sees plaintext

### Download

1. Fetch encrypted chunks
2. Decrypt folder key with CMK
3. Decrypt FEK with folder key
4. Decrypt chunks with FEK
5. Reassemble file in browser

All decryption in browser memory. Temporary decrypted data cleared after use.

## Threat model

### What Agam Space protects against

✅ **Server compromise** - Server only has encrypted data  
✅ **Database leak** - All data encrypted, keys not stored  
✅ **Malicious admin** - Admin cannot read your files  
✅ **Network sniffing** - HTTPS encrypts transit (use it)  
✅ **Stolen backups** - Backups are encrypted data

### What Agam Space does NOT protect against

❌ **Compromised client device** - Malware on your device can capture keys  
❌ **Keylogger** - Can steal master password as you type  
❌ **Phishing** - Entering password on fake site  
❌ **Coercion** - Someone forcing you to unlock  
❌ **Quantum computers** - Not quantum-resistant (yet)

### Server trust

While the server can't read your data, a malicious server could:

- Serve backdoored JavaScript to steal your keys
- Refuse to serve your encrypted data
- Track your access patterns

**Mitigation:**

- Self-host (you control the server)
- Pin certificate and verify code integrity (advanced)
- Use Docker image with known hash

## Best practices

**Strong master password:**

- Use unique password (not your login password)
- 20+ characters or passphrase
- Mix letters, numbers, symbols
- Don't reuse from other services

**Recovery key:**

- Save immediately after setup
- Store offline (paper, USB drive)
- Keep multiple copies in different locations
- Test recovery process

**Device security:**

- Use device encryption (FileVault, BitLocker)
- Lock screen when away
- Keep OS and browser updated
- Use trusted devices only

**Network:**

- Always use HTTPS in production
- Don't use on public WiFi without VPN
- Verify TLS certificate

## Auditing

Agam Space has not been professionally audited. This is a personal project for
learning and self-hosting.

If the project gains traction and community adoption, a professional security
audit may be conducted. For now, use at your own risk and keep backups.

## Reporting security issues

**Thank you for helping improve Agam Space's security!**

If you discover a vulnerability, please report it privately via email to:
**security.agamspace@proton.me**

**Do NOT report security vulnerabilities through public GitHub issues.**

Your contribution helps make the project safer for everyone in the community.

## Further reading

- [Architecture](./architecture) - Technical implementation details
- [FAQ](./faq#security-questions) - Common security questions
