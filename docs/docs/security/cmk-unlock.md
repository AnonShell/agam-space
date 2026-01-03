---
sidebar_position: 2
---

# Unlocking Master Key

How to unlock your Cryptographic Master Key (CMK) to access encrypted data.

## Overview

After logging in, your CMK must be unlocked to decrypt files. The CMK is always
encrypted at rest - you need to unlock it to load it into browser memory.

**Important: Your CMK is never stored in plaintext anywhere.** It only exists
unencrypted in browser memory during an active session. All persistence (server
database, browser storage) contains only encrypted forms of the CMK.

**Three methods available, each with different convenience vs security
trade-offs:**

## 1. Master Password (Default)

Enter your master password every time to unlock the CMK.

**When you'll need to enter it:**

- First time after login
- Every page reload (unless using sessionStorage option)

This can feel repetitive if you're frequently reloading pages or switching
between tabs.

**How it works:**

1. Browser prompts for master password
2. Argon2id derives key from password (client-side)
3. Derived key decrypts CMK
4. CMK loaded into memory

**Security:** Most secure option. Master password never stored anywhere, CMK
never persisted. The downside is needing constant access to your master
password.

## 2. Trusted Device Unlock (WebAuthn)

Use biometric authentication instead of typing your master password.

**Why this exists:**

Needing constant access to your master password is inconvenient:

- Password managers can't auto-fill master passwords (by design)
- On mobile devices, retrieving and typing passwords is tedious
- Frequent interruptions break workflow

Trusted devices solve this by using biometric authentication (Touch ID, Face ID,
Windows Hello) that's quick and doesn't require accessing your password manager.

**Requirements:**

- Register device once with master password
- HTTPS required (WebAuthn security requirement)
- Device with biometric hardware

**How it works:**

**Registration (one-time):**

1. Client generates device keypair (X25519 public/private keys)
2. Client generates random server nonce (16 bytes)
3. Client generates random device seed (16 bytes)
4. Client generates random salt (16 bytes)
5. Unlock key derived using Argon2id from: server nonce + device seed + salt
6. Device private key encrypted with derived unlock key
7. CMK encrypted with device public key
8. WebAuthn credential created in device secure hardware
9. **Server stores:** Server nonce, encrypted CMK, device public key
10. **Client stores in IndexedDB:** Encrypted device private key, device seed,
    salt, device public key

**Subsequent logins:**

1. Enter login credentials (password or SSO)
2. Biometric prompt (Touch ID, Face ID, fingerprint)
3. WebAuthn creates authentication signature
4. Server verifies WebAuthn signature
5. Server sends server nonce (only after successful verification)
6. Client retrieves device seed + salt from IndexedDB
7. Unlock key derived using Argon2id from: server nonce + device seed + salt
8. Derived unlock key decrypts device private key
9. Device private key decrypts CMK
10. CMK loaded into memory

**Security - Split-Key Model:**

Uses a split-key approach where the **derived unlock key** is never persisted -
it's computed on-demand from three stored components. Neither server breach nor
client storage theft alone can decrypt the CMK:

**Server stores:**

- Server nonce (16 bytes, stored in database as `unlockKey`)
- Encrypted CMK
- Device public key

**Client stores (IndexedDB, one device per browser):**

- Encrypted device private key
- Device seed (16 bytes)
- Salt (16 bytes)
- Device public key

**Unlock key derivation:**

```
unlockKey = Argon2id(serverNonce + deviceSeed, salt)
```

**What this prevents:**

- **Server breach alone:** Attacker gets server nonce but cannot derive unlock
  key without device seed and salt (stored client-side only)
- **Client storage theft alone:** Attacker gets device seed, salt, and encrypted
  device private key but cannot derive unlock key without server nonce (requires
  WebAuthn authentication)
- **Compromised session:** Cannot retrieve server nonce without WebAuthn proof
  from device secure hardware

**Requirements for successful unlock:**

1. Valid login session
2. WebAuthn authentication (biometric or hardware key)
3. Server nonce (released only after WebAuthn proof)
4. Device seed + salt from client IndexedDB
5. Derive unlock key using Argon2id
6. Decrypt device private key
7. Decrypt CMK with device private key

**Device Registration:**

- One trusted device per browser instance
- Each device has unique server nonce, device seed, and salt
- Multiple browsers/devices can be registered (e.g., laptop + phone + tablet)
- Removing a device from the server also requires clearing client-side data

## 3. Auto-unlock on Page Reload (Optional)

**⚠️ If you need maximum security, keep this option disabled.**

Avoid re-entering your password or biometric prompt when reloading the page
(Disabled by default). You must explicitly enable this in Settings → Encryption
→ "Auto-unlock on page reload"

**Why this exists:**

Even with trusted devices, biometric prompts on every page reload can feel
excessive. This feature lets you unlock once, then stays unlocked until you
close the tab or the 15-minute window expires.

**How it works:**

After you unlock (with master password or trusted device):

1. Client generates random seed (stored in sessionStorage, tab-scoped)
2. Server issues random nonce (unique per login session, 15-minute TTL, cached
   in memory)
3. Encryption key derived from server nonce + client seed using Argon2id
4. CMK encrypted using XChaCha20-Poly1305 with derived key
5. Encrypted CMK stored in IndexedDB, namespaced by tab ID

**On page reload:**

1. Client retrieves seed from sessionStorage
2. Client requests server nonce (strict server-side validation - only issued
   with valid session)
3. Derives decryption key from nonce + seed
4. Decrypts CMK from IndexedDB
5. CMK loaded into memory

**Security model:**

Split-key approach where **both** server and client components are required.
Without either, the encrypted CMK is undecryptable:

- **Server:** Random nonce (unique per session, 15-minute TTL)
- **Client:** Random seed in sessionStorage (cleared on tab close)
- **IndexedDB:** Encrypted CMK

**Why 15-minute limit:**

Server nonce expires after 15 minutes to limit the window of opportunity if
session credentials are compromised. Even if an attacker steals your session
cookie and encrypted CMK from IndexedDB, they only have 15 minutes before the
nonce expires and the encrypted CMK becomes undecryptable. Your login session
remains active - you'll just need to unlock again.

**What this protects against:**

- **Stolen browser profile:** Encrypted CMK useless without server nonce
  (requires valid session) and client seed (cleared on tab close)
- **Time-limited exposure:** Server nonce expires after 15 minutes
- **Session hijacking:** Session cookie is HttpOnly (JavaScript cannot read it),
  preventing client-side session theft
- **Tab isolation:** Each tab has independent seed and encrypted CMK entry

**What this does NOT protect against:**

- **XSS attacks:** Malicious JavaScript can access sessionStorage (client seed)
  and make API calls (browser automatically sends HttpOnly cookie) to get server
  nonce, then decrypt CMK from IndexedDB
- **Browser extensions with network permissions:** Can access sessionStorage and
  IndexedDB, and make API requests (browser sends HttpOnly cookie automatically)
  to obtain server nonce

**When auto-unlock fails:**

You'll be prompted to unlock manually (no data loss) when:

- Server nonce expires (after 15 minutes - login session remains active)
- Tab closed (client seed lost)
- Logout (all data wiped)
- Session revoked on server

**Security vs convenience:**

This is a session-bound convenience feature that relies on the browser
environment being trusted (no XSS, no malicious extensions).

If your threat model requires maximum security, keep this disabled and use
master password or trusted device unlock on every page load.

## Two-Layer Protection

Regardless of which unlock method you use, accessing your encrypted files
requires **both**:

- **Valid login session** - to make authenticated API requests to download
  encrypted files
- **Unlocked CMK in memory** - to decrypt the downloaded files

CMK alone is useless without server access. Login session alone cannot decrypt
files. Both are required.

## Further Reading

- [Recovery](./recovery.md) - Recovery key usage
- [Encryption](./encryption.md) - How CMK encrypts data
