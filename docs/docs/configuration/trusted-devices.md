---
sidebar_position: 6
---

# Trusted Devices

Enable passkey unlock on your devices (Touch ID, Face ID, Windows Hello).

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
6. Follow passkey registration prompt (Touch ID, Face ID, etc.)
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

## Settings

**Device persistence:**

Device credentials persist locally (browser storage) by default. This allows
passkey unlock without re-registration after logout.

Your data remains encrypted - only the unlock mechanism is persisted, not your
actual files or encryption key.

**Clear device data on logout:**

By default, your device credentials stay saved after logout. If you prefer to
remove them:

1. Go to **Settings** → **Security** → **Trusted Devices**
2. Enable **Clear device data on logout**
3. Next logout will remove local credentials
4. You'll need to re-register this device on next login

When disabled (default):

- Device stays registered after logout
- Passkey unlock works on next login
- No need to re-register

## Security

**Never stored locally:**

- Master password
- Encryption key (CMK)
- Server nonce

**Device-specific passkeys:**

The passkey itself is not device-bound - your password manager can sync it
across devices. What IS device-bound is the private key stored encrypted in your
device's IndexedDB. Even if your password manager syncs the passkey across
devices (like Chrome or Bitwarden), they cannot unlock Agam Space on another
device. Here's why:

During registration, your device generates a unique private key and stores it
encrypted in IndexedDB using a key derived from your passkey. To unlock, the
browser must have access to this encrypted private key stored locally on that
device. On a different device, it won't have Device A's private key.

**Example:** If you register Device A with a passkey, and your password manager
syncs it to Device B, the synced passkey on Device B is useless because Device
B's doesn't have Device A's private key. You must login with your master
password on Device B and register it separately.

**Enhanced security:**

Your private key is encrypted in IndexedDB using a key derived from your
passkey. This means even if someone gains access to your device's local storage,
they cannot decrypt the private key without your passkey.

## Troubleshooting

**Register button greyed out:**

- Must be on HTTPS (not http://localhost)
- Check device has biometric hardware
- Try different browser

**Passkey prompt doesn't appear:**

- Check browser supports passkeys
- Enable biometric in OS settings (Touch ID, Windows Hello)
- Try incognito/private mode to test

**Device unlock not working:**

- Device may have been removed
- Browser cache cleared (clears passkey data)
- Re-register device

**Works on Chrome, not Firefox:**

- Some browsers have stricter passkey support
- Update browser to latest version
- Check browser passkey settings

## Recovery

Lost all trusted devices? Login with master password and register new device.

Forgot master password? Use recovery key from Settings → Security → Recovery.
