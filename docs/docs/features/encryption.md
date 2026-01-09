# Encryption

Zero-knowledge, end-to-end encrypted file storage.

All encryption happens in your browser before any data leaves your device. The
server stores only encrypted blobs and has no way to decrypt them. This is true
zero-knowledge: the server operator (even if it's you running your own instance)
cannot access your files, folder names, or any metadata.

## What gets encrypted

- File contents
- File names
- Folder names
- MIME types
- All metadata

See [Encryption Details](../security/encryption) for technical implementation.

## What the server can see

- Your email address
- File sizes (for quota enforcement)
- Upload timestamps
- Encrypted data blobs (unreadable without your keys)

## Master password is the root of trust

Your master password generates your Cryptographic Master Key (CMK) using
Argon2id (memory-hard, GPU-resistant key derivation). This CMK is the foundation
of your encryption - it derives all other keys.

**Critical:** Your master password never leaves your device. The server only
stores your CMK encrypted with your password - it cannot decrypt it without your
master password.

Without your master password (or recovery key), your data is mathematically
unrecoverable. Even the server admin cannot help you.

See [Trust Model](../security/trust-model) for how this protects your data.

## Industry-standard cryptography

- **File encryption:** XChaCha20-Poly1305 (256-bit keys, authenticated
  encryption)
- **Key derivation:** Argon2id (memory-hard, GPU-resistant)
- **Device keys:** X25519 (elliptic curve Diffie-Hellman)

## Recovery key

Generated during setup as a backup to decrypt your CMK. If you forget your
master password, the recovery key is the only way to regain access to your
files.

You can view and download your recovery key anytime from Settings. Save it
somewhere safe - preferably offline, like a password manager or printed on
paper.

**Important:** The recovery key alone cannot decrypt your data - an attacker
would also need your login credentials to access the server. However, if someone
compromises both your account and recovery key, they can access your files. Keep
both secure.
