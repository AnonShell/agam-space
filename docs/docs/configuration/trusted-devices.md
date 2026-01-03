---
sidebar_position: 6
---

# Trusted Devices

Enable biometric unlock on your devices (Touch ID, Face ID, Windows Hello).

## What is Trusted Device Unlock?

After registering a device, you can unlock Agam Space with biometrics instead of
typing your master password every time.

**How it works:**

1. **Register device (requires master password once):**
   - Client generates device keypair (X25519 public/private keys)
   - Client generates server nonce (16 bytes)
   - Client generates device seed (16 bytes)
   - Client generates salt (16 bytes)
   - Unlock key derived using Argon2id from: server nonce + device seed + salt
   - Device private key encrypted with derived unlock key
   - CMK encrypted with device public key
   - WebAuthn credential created in device secure hardware
   - **Server stores:** Server nonce, encrypted CMK, device public key
   - **Client stores (IndexedDB):** Encrypted device private key, device seed,
     salt

2. **On subsequent logins:**
   - Enter login credentials (password or SSO)
   - Biometric prompt (Touch ID, Face ID, fingerprint)
   - WebAuthn creates authentication signature
   - Server sends server nonce (only after successful verification)
   - Client retrieves device seed + salt from IndexedDB
   - Unlock key derived using Argon2id from: server nonce + device seed + salt
   - Derived unlock key decrypts device private key
   - Device private key decrypts CMK
   - CMK loaded in memory

**Security model - Split-Key:**

The **derived unlock key** is never persisted - it's computed on-demand from
three stored components:

- **Server has:** Server nonce (16 bytes) - released only after WebAuthn
  verification
- **Client has:** Device seed (16 bytes) + salt (16 bytes) in IndexedDB
- **Derivation:** `Argon2id(serverNonce + deviceSeed, salt)` = unlock key
  (ephemeral, not stored)

**Protection:**

- **Server breach alone:** Cannot derive unlock key without device seed and salt
- **Client storage theft alone:** Cannot derive unlock key without server nonce
- **WebAuthn required:** Server nonce only released after biometric
  authentication

One device per browser. Each device has unique nonce, seed, and salt.

## Requirements

- **HTTPS required** (doesn't work on http://localhost)
- Device with biometric hardware (Touch ID, Face ID, Windows Hello, fingerprint
  reader)
- Supported browser (Chrome, Firefox, Safari, Edge)

## Register Your First Device

1. Login to Agam Space
2. Unlock with master password
3. Go to **Settings** → **Security** → **Trusted Devices**
4. Click **Register This Device**
5. Give device a name (e.g., "My MacBook Pro")
6. Follow biometric prompt (Touch ID, Face ID, etc.)
7. Done!

Next time you login on this device:

1. Enter email and login password
2. Biometric prompt (no master password needed)
3. You're in!

## Register Additional Devices

Each device must be registered separately:

- Laptop at home
- Work computer
- Phone
- Tablet

**Steps:**

1. Login on new device with master password
2. Register device (same steps as above)
3. Each device gets its own unique key

## View Registered Devices

Settings → Security → Trusted Devices shows:

- Device name
- Registration date
- Last used
- Browser/OS info

## Remove Device

To revoke device access:

1. Go to **Settings** → **Security** → **Trusted Devices**
2. Click **Remove** next to the device
3. Confirm removal

## Security

**Split-key security model:**

The unlock key is never stored - it's derived on-demand from:

- Server nonce (from server, requires WebAuthn authentication)
- Device seed (from IndexedDB)
- Salt (from IndexedDB)

**Storage:**

- **Server:** Server nonce, encrypted CMK, device public key
- **Client IndexedDB:** Encrypted device private key, device seed, salt, device
  public key

**Attack resistance:**

- Server breach: Cannot derive unlock key without client seed + salt
- Client storage theft: Cannot derive unlock key without server nonce
- Session hijacking: Server nonce requires WebAuthn authentication

**One device per browser** - registering again from the same browser overwrites
the previous device.

## Troubleshooting

**Register button greyed out:**

- Must be on HTTPS (not http://localhost)
- Check device has biometric hardware
- Try different browser

**Biometric prompt doesn't appear:**

- Check browser supports WebAuthn
- Enable biometric in OS settings (Touch ID, Windows Hello)
- Try incognito/private mode to test

**Device unlock not working:**

- Device may have been removed
- Browser cache cleared (clears WebAuthn data)
- Re-register device

**Works on Chrome, not Firefox:**

- Some browsers have stricter WebAuthn policies
- Update browser to latest version
- Check browser WebAuthn settings

## Recovery

Lost all trusted devices? Login with master password and register new device.

Forgot master password? Use recovery key from Settings → Security → Recovery.
