---
sidebar_position: 6
---

# Trusted Devices

Enable biometric unlock on your devices (Touch ID, Face ID, Windows Hello).

## What is Trusted Device Unlock?

After registering a device, you can unlock Agam Space with biometrics instead of
typing your master password every time.

**How it works:**

1. Register device (requires master password once)
2. Client generates device keypair (X25519 public/private keys)
3. Client generates random unlock key
4. Device private key encrypted with unlock key
5. CMK encrypted with device public key
6. WebAuthn credential created (stores credential in device secure hardware)
7. Server stores: encrypted CMK, unlock key (plaintext), device public key,
   WebAuthn credential ID

**On subsequent logins:**

1. Enter login credentials (password or SSO)
2. Biometric prompt unlocks WebAuthn credential
3. Server sends: unlock key + encrypted device private key (for valid session)
4. Client: unlock key decrypts device private key
5. Client: device private key decrypts CMK
6. CMK loaded in memory for this session

Server stores unlock key in plaintext. Security relies on requiring valid
session + WebAuthn authentication to retrieve it.

**Security model:**

- **Server cannot decrypt CMK:** Server has unlock key but not encrypted device
  private key (stored client-side only)
- **Client cannot decrypt without biometric:** Encrypted device private key is
  useless without unlock key from server
- **Unlock key only issued after WebAuthn authentication:** Server validates
  biometric proof before sending unlock key
- **Result:** Both server access AND physical device with biometric are required
  to decrypt CMK

This prevents compromise from either server breach or device theft alone.

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

- Encrypted device private key stored client-side only
- Unlock key stored server-side (plaintext)
- Both required to decrypt CMK
- Server only sends unlock key after WebAuthn authentication

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
