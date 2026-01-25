# Public Sharing Security

How public links work and what security they provide.

## Split-Key Encryption

Public shares split the encryption key into two parts:

**Client generates:**

- `clientKey` (32 bytes) → goes in URL #fragment
- `serverShareKey` (32 bytes) → sent to server
- `salt` (16 bytes) → sent to server

**Key derivation:**

```
wrapKey = Argon2id(clientKey + serverShareKey + password?, salt)
wrappedItemKey = XChaCha20-Poly1305(fileKey, wrapKey)
```

**Distribution:**

- Server stores: `serverShareKey`, `wrappedItemKey`, `salt`, `passwordHash`
- URL contains: `clientKey` in #fragment
- Both needed to decrypt

**Why split:**

- Server alone: has `serverShareKey` but missing `clientKey` → cannot decrypt
- URL alone: has `clientKey` but missing `serverShareKey` → cannot decrypt
- Together: can derive `wrapKey` and unwrap `fileKey`

## Password Protection

Optional. Adds password to key derivation.

**Server-side:**

- Stores Argon2id hash of password
- Verifies password before returning keys
- 10 attempts/min rate limit

**Client-side:**

- Derives `wrapKey` using password
- Wrong password = wrong `wrapKey` = decryption fails

## Access Control

**Access tokens:**

- Generated after password verification
- 15-minute TTL, stored in memory
- Required for content/chunk requests
- Server restart = all tokens invalidated

**Descendant validation:**

- File share: requested `fileId` must match `share.itemId`
- Folder share: requested item must be the folder or a descendant
- Prevents access to files outside the share

## Rate Limiting

Per IP address:

| Endpoint              | Limit   |
| --------------------- | ------- |
| Share metadata        | 30/min  |
| Password verification | 10/min  |
| Content/folders       | 100/min |
| File chunks           | 100/min |

Exceeds limit → 429 Too Many Requests

**Why:**

- Share ID enumeration (62^12 combinations at 30/min = trillions of years)
- Password brute force (10/min = hours for weak passwords)

## What the Server Knows

**Server has:**

- Share ID, owner ID, item ID, item type
- `serverShareKey`, `wrappedItemKey`, `salt`
- Password hash (if protected)
- Expiration timestamp
- Access times (via tokens)

**Server cannot see:**

- File/folder name (encrypted)
- File content (encrypted)
- Password (only hash)
- File/folder key (wrapped, missing `clientKey`)

**Public metadata (no auth):**

- Share ID, item type, expiration, password required (yes/no)

**After password verification:**

- `serverShareKey`, `wrappedItemKey`, `salt`, access token

**NOT exposed:**

- Owner ID, actual item ID, password hash

## Cryptographic Details

- **Key derivation:** Argon2id
- **Encryption:** XChaCha20-Poly1305
- **Random:** `clientKey`, `serverShareKey`, `salt`, access token
  (cryptographically secure)
- **Share ID:** 12 chars (62-char alphabet, 71.4 bits entropy)

## Attack Scenarios

**Compromised database:**

- Attacker gets `serverShareKey`, `wrappedItemKey`, password hashes
- Cannot decrypt without URLs (missing `clientKey`)

**Intercepted URL:**

- Attacker gets full URL with `clientKey`
- Can decrypt if no password

**MITM (breaks TLS):**

- Can intercept `serverShareKey`, `wrappedItemKey`
- Cannot get `clientKey` (in URL #fragment, never sent to server)

**Malicious server:**

- Can serve JavaScript to steal `clientKey` from `window.location.hash`
- Web app trust model limitation (see [Trust Model](./trust-model.md))
