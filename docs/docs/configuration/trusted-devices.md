---
sidebar_position: 6
---

# Trusted Devices

Enable biometric unlock on your devices (Touch ID, Face ID, Windows Hello).

## What is Trusted Device Unlock?

After registering a device, you can unlock Agam Space with biometrics instead of
typing your master password every time.

**How it works:**

1. Register device once (requires master password)
2. WebAuthn creates hardware-backed key in secure enclave
3. Your CMK encrypted with device public key
4. Future logins: biometric unlocks device key → decrypts CMK
5. Server never sees master password or device private key

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

If you lose a device or want to revoke access:

1. Go to **Settings** → **Security** → **Trusted Devices**
2. Click **Remove** next to the device
3. Confirm removal

That device can no longer unlock with biometrics (must use master password).

**Pro tip:** Remove old devices you no longer use.

## How Secure Is This?

**Very secure:**

✅ Private key stored in hardware secure enclave (TPM, Secure Enclave, etc.)  
✅ Private key never extracted from device  
✅ Biometric proves physical device ownership  
✅ Each device has unique key pair  
✅ Server never sees private key or master password  
✅ CMK encrypted separately per device

**Threat model:**

- ✅ **Stolen device (locked):** Attacker can't unlock without biometric
- ✅ **Stolen device (unlocked):** Same risk as unlocked laptop anyway
- ✅ **Phishing:** Can't be phished (hardware-bound)
- ✅ **Server compromise:** Server only has encrypted CMK
- ❌ **Malware on device:** Can capture CMK after unlock (same risk as password
  login)

**Recommendation:** Use trusted device unlock for convenience on your personal
devices. For shared/public computers, use master password only.

## Session Expiry

Even with trusted device unlock, sessions expire:

- **15 minutes inactivity** - Auto-logout
- **Tab close** - Session cleared
- **Manual logout** - Session cleared

After expiry, you'll need to unlock again (with biometric on trusted device).

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

## Privacy

Device registration stores:

- Device public key (can't decrypt anything)
- Device name (you choose this)
- Browser user agent string
- Registration and last-used timestamps

Not stored:

- Device private key (stays in hardware)
- Master password
- Biometric data (handled by OS, never sent to server)

## Best Practices

**Do:**

- Register all your personal devices
- Use descriptive names ("MacBook Pro 2024", "iPhone 13")
- Review and remove old devices periodically
- Keep master password in password manager as backup

**Don't:**

- Register shared/public computers
- Share devices with registered unlock
- Rely only on device unlock (remember master password)
- Register device you're about to sell (remove first)

## Combining with SSO

You can use both SSO and trusted device unlock:

1. Login with SSO (convenient)
2. Unlock with device biometric (convenient)
3. No passwords to type! (except first time setup)

**Flow:**

- SSO handles authentication
- Trusted device unlocks encryption
- Best of both worlds

## Recovery

**Lost all trusted devices?**

No problem! You can still login:

1. Login with email/password (or SSO)
2. Unlock with master password (type it manually)
3. Register your new device
4. Done

**Forgot master password?**

Use recovery key:

1. Settings → Security → Recovery
2. Enter recovery key
3. Decrypt CMK
4. Set new master password
5. Re-register devices with new master password

## Next Steps

👥 **[User Management](./user-management.md)** - Add users and set quotas

💾 **[Backups](../installation/backups.md)** - Set up automated backups
