---
sidebar_position: 2
---

# Unlocking Master Key

How to unlock your Cryptographic Master Key (CMK) to access encrypted data.

## Overview

After logging in, your CMK must be unlocked to decrypt files. The CMK is always
encrypted at rest - you need to unlock it to load it into browser memory.

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
2. Client generates random unlock key
3. Device private key encrypted with unlock key
4. CMK encrypted with device public key
5. WebAuthn credential created in device secure hardware
6. Server stores: encrypted CMK, unlock key (plaintext), device public key

**Subsequent logins:**

1. Enter login credentials (password or SSO)
2. Biometric prompt (Touch ID, Face ID, fingerprint)
3. WebAuthn validates against device secure hardware
4. Server sends unlock key (only after WebAuthn proof)
5. Unlock key decrypts device private key
6. Device private key decrypts CMK
7. CMK loaded into memory

**Security - Split-Key Model:**

This uses a split-key approach where neither server nor client alone can decrypt
the CMK:

- **Server has:** Unlock key (plaintext) but NOT encrypted device private key
- **Client has:** Encrypted device private key but NOT unlock key
- **Server only sends unlock key after:** Valid login session + WebAuthn
  authentication proof

**What this prevents:**

- **Server breach:** Attacker gets unlock key but cannot decrypt CMK without
  encrypted device private key (stored client-side only)
- **Device theft:** Attacker gets encrypted device private key but cannot get
  unlock key without biometric authentication
- **Compromised session token:** Cannot retrieve unlock key without WebAuthn
  proof from device secure hardware

**Both required:** Server access (valid session + unlock key) AND physical
device (biometric authentication) to decrypt CMK.

## 3. SessionStorage Persistence (Optional)

Keep CMK unlocked across page reloads without re-authenticating.

**Why this exists:**

Even with trusted devices, you still get a biometric prompt on every page
reload. For some users, this feels excessive - especially if you're just
accidentally refreshing or navigating between pages in the same session.

SessionStorage persistence lets you unlock once (with master password or
biometric), then stays unlocked until you close the tab or after 15 minutes of
inactivity (client-side).

**How it works:**

- After unlocking CMK (via master password or trusted device), CMK is saved to
  sessionStorage
- Page reload retrieves CMK from sessionStorage - no prompt needed
- 15-minute inactivity timeout
- Cleared automatically on tab close or logout

**The trade-off:**

This is the most convenient option but comes with a security compromise:

**Convenience side:**

- Unlock once, work freely without interruption
- No re-entering master password on page reload
- No biometric prompt on accidental refresh

**Security risk side:**

- CMK stored in plaintext in sessionStorage
- SessionStorage accessible to JavaScript - XSS attacks can read it
- CMK readable via browser console/developer tools (sessionStorage.getItem)
- CMK persists in browser until timeout or tab close

**Important mitigation:** Even if an attacker steals your CMK from
sessionStorage (via XSS), they still can't access your encrypted files without a
valid login session. The server validates every API request - CMK alone is
useless without authentication.

**Future improvement:** Actively looking to improve this security model to
balance convenience and security. If you know better approaches, feel free to
suggest via GitHub issues.

## Security Model

**CMK in memory:**

- Required to decrypt files
- Exists only during active session
- Cleared on logout or page close

**Two-layer protection:**

- CMK alone cannot download encrypted files (needs valid login session for API
  requests)
- Login session alone cannot decrypt files (needs CMK from master password)

Both pieces required to access encrypted data.

## Further Reading

- [Recovery](./recovery.md) - Recovery key usage
- [Encryption](./encryption.md) - How CMK encrypts data
