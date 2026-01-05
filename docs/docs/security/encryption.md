---
sidebar_position: 4
---

# Encryption

How Agam Space encrypts your data using zero-knowledge, end-to-end encryption.

## Zero-Knowledge Encryption

**Zero-knowledge** means the server cannot decrypt your data under any
circumstances.

**Why it matters:**

- Server compromise → Your data stays encrypted
- Database leak → Only encrypted blobs exposed
- Malicious admin → Cannot read your files
- Stolen backups → Still encrypted

**The trade-off:**

Lose your master password AND recovery key → Data is permanently unrecoverable.
No password reset, no admin recovery. This is by design.

## Cryptographic Primitives

All cryptography uses industry-standard, battle-tested algorithms. No custom
crypto.

### Key Derivation

**Algorithm:** Argon2id (via libsodium)

- **opslimit:** 3 (number of passes over memory)
- **memlimit:** 65536 KB (64 MB of memory)
- **Output:** 32 bytes (256 bits)

### Device Keys

**Algorithm:** X25519 (Curve25519 ECDH)

- **Key size:** 256 bits (32 bytes)
- **Purpose:** Device unlock key agreement

### File Encryption

**Algorithm:** XChaCha20-Poly1305 (AEAD cipher)

- **Cipher:** XChaCha20 (stream cipher)
- **Authentication:** Poly1305 (MAC)
- **Nonce:** 192 bits (24 bytes)
- **Key size:** 256 bits (32 bytes)

### Hashing

**BLAKE3:**

- **Output:** Variable (default 256 bits)
- **Purpose:** File chunk checksums

**SHA-256:**

- **Output:** 256 bits
- **Purpose:** Legacy compatibility

## Key Hierarchy

Your master password is the root of trust. All encryption keys derive from it.

```
Master Password (user-chosen, never stored)
    ↓
    Argon2id Key Derivation
    ↓
Cryptographic Master Key (CMK)
32 bytes, random, encrypted at rest
    ↓
Folder Keys (one per folder)
32 bytes each, random, encrypted with parent folder key or CMK for root
    ↓
File Encryption Keys (FEK - one per file)
32 bytes each, random, encrypted with folder key
    ↓
Encrypted File Chunks
XChaCha20-Poly1305, 5MB chunks
```

### Master Password

- **Input:** User-chosen passphrase
- **Storage:** Never stored anywhere (client or server)
- **Usage:** Derives CMK via Argon2id when needed

### Cryptographic Master Key (CMK)

**Generation:** Random 32 bytes (256 bits)

**Storage:**

- **Client-side:** In browser memory during session (cleared on logout)
- **Client-side (Optional):** Encrypted in IndexedDB for auto-unlock (if enabled
  in settings)
- **Server-side:** Encrypted with password-derived key (server cannot decrypt)

**Encrypted storage format:**

```
Password → Argon2id → Derived Key (256 bits)
Derived Key → XChaCha20-Poly1305 → Encrypted CMK
```

**Auto-unlock storage (optional):**

```
Server Nonce + Client Seed → Argon2id → Derived Key (256 bits)
Derived Key → XChaCha20-Poly1305 → Encrypted CMK (stored in IndexedDB)
```

See [Auto-unlock](./cmk-unlock#3-auto-unlock-on-page-reload-optional) for
details.

Server stores only encrypted CMK. Without master password, cannot derive key to
decrypt CMK.

### Folder Keys

Each folder gets a random 32-byte encryption key.

**Root folder:** Folder key encrypted with CMK

**Nested folders:** Folder key encrypted with parent folder key

**Benefits:**

- Each folder independent
- Folder sharing (future): Share folder key without exposing CMK or parent keys
- Key isolation: Compromising one folder key doesn't expose others

### File Encryption Keys (FEK)

Each file gets a random 256-bit key, encrypted with its folder key.

**Why random keys:**

- Each file independent
- No key reuse across files
- Each chunk gets a fresh random nonce (XChaCha20 uses 192-bit).

## Encryption Process

### File Upload

**Step-by-step:**

1. **Generate file encryption key (FEK):**
   - Random 32-byte key

2. **Split file into 5MB chunks**

3. **Encrypt each chunk:**
   - Generate random 24-byte nonce
   - Encrypt chunk with XChaCha20-Poly1305 (using FEK + nonce)
   - Serialize encrypted envelope to TLV binary format
   - Compute BLAKE3 checksum of TLV-encoded chunk
   - Upload TLV-encoded chunk and checksum

   **Note:** File chunks use raw TLV (Type-Length-Value) binary encoding for
   efficiency. Metadata uses base64-encoded TLV for JSON transport. Each chunk
   is checksummed (BLAKE3) and verified on upload for integrity.

4. **Encrypt FEK with folder key:**
   - Encrypt FEK using folder key

5. **Encrypt metadata:**
   - Encrypt filename with folder key
   - Encrypt MIME type with folder key

6. **Upload to server:**
   - Encrypted chunks (TLV binary)
   - Checksums (BLAKE3, one per chunk)
   - Encrypted FEK (base64-encoded TLV)
   - Encrypted metadata (base64-encoded TLV)
   - File size (plaintext)
   - Chunk count (plaintext)

**Server never sees:** File content, filename, MIME type, or FEK in plaintext.

### File Download

**Step-by-step:**

1. **Fetch encrypted data from server:**
   - Encrypted chunks
   - Encrypted FEK
   - Encrypted metadata

2. **Decrypt folder key:**
   - Decrypt encrypted folder key using parent folder key (or CMK for root)

3. **Decrypt FEK:**
   - Decrypt FEK using folder key

4. **Decrypt each chunk:**
   - Deserialize TLV binary format to encrypted envelope
   - Decrypt envelope using FEK

5. **Reassemble file:**
   - Concatenate all decrypted chunks

6. **Cleanup:**
   - Decrypted data in memory only
   - Cleared after use

**All decryption happens in browser.** Server never sees plaintext.

## What Gets Encrypted

### Encrypted Data

**File contents:**

- Every byte of file data
- Split into 5MB chunks
- Each chunk individually encrypted

**File metadata:**

- File names
- Folder names
- MIME types
- Created/modified timestamps (client-side)
- Custom tags (future feature)

**Encryption keys:**

- File encryption keys (FEK)
- Folder keys (when stored)
- Recovery key (when stored server-side)

### Plaintext Data (Server-Visible)

**Required for functionality:**

- **File sizes** - Quota enforcement
- **Chunk counts** - Download coordination
- **Upload timestamps** - Server-side tracking
- **File IDs** - Random ULID
- **Folder IDs** - Random ULID

**User data:**

- Email addresses (authentication)
- Login password hash (Argon2id)
- User ID (ULID)

## Encrypted Envelope Format

All encrypted data uses a consistent envelope format with TLV
(Type-Length-Value) encoding:

```typescript
{
  v: number,           // Version (1 byte)
  n: Uint8Array,       // Nonce (24 bytes for XChaCha20)
  c: Uint8Array        // Ciphertext (variable length, includes Poly1305 tag)
}
```

### TLV Structure

Each field is encoded as Type-Length-Value:

```
┌──────────┬──────────────────┬────────────────┐
│   Type   │     Length       │     Value      │
│  1 byte  │  4 bytes (BE)    │   N bytes      │
└──────────┴──────────────────┴────────────────┘
```

**Type codes:**

- `0x01` = version
- `0x02` = nonce
- `0x03` = ciphertext

**Length:** 4 bytes, indicates size of value field

**Value:** Variable-length data

**Why TLV:**

- Self-describing format (no fixed positions)
- Forward compatible (can skip unknown types)
- Efficient binary encoding
- No delimiters or escaping needed

**Base64 encoding for storage/transmission** (for metadata/keys only, not file
chunks).

**Note:** XChaCha20-Poly1305 includes the 16-byte Poly1305 authentication tag at
the end of the ciphertext automatically. The envelope does not store it
separately.

## Limitations

**Be aware:**

- CMK compromise → All data decryptable
- Master password brute-force → Possible if weak password
- Client-side malware → Can steal keys from memory
- No plausible deniability (encrypted data obviously encrypted)
- No protection after decryption (screencast, screenshots)

## Further Reading

- [Authentication](./authentication.md) - Login and session security
- [Unlocking Master Key](./cmk-unlock.md) - How to unlock encryption keys
- [Recovery](./recovery.md) - Recovery key usage
