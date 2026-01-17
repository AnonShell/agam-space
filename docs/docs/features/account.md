# Account

Agam Space supports multiple users, each with their own encrypted storage. Users
cannot access each other's files - every user has their own Cryptographic Master
Key (CMK) that encrypts their data.

## User roles

**Owner**  
The first user who registers becomes the Owner. The Owner has full admin access
to manage other users, set quotas, and configure the instance.

**Admin**  
Users with admin privileges can manage other users and configure settings.
Admins are assigned by the Owner.

**Regular users**  
Additional users can register via self-registration (if enabled in
configuration). Each user gets their own encrypted storage space with
configurable quota limits.

## Two-layer security

Agam Space separates authentication from encryption for better security:

1. **Login password** - Authenticates your identity to the server (like any web
   service)
2. **Master password** - Unlocks your encryption keys (never sent to server)

This separation protects your data from both threats:

- **If someone compromises your account** (login credentials), they still cannot
  decrypt your data without your master password
- **If someone obtains your master password**, they cannot access your data
  without valid login credentials and an active session

## Login flow

When you log in to Agam Space:

1. Enter email and login password
2. Server verifies credentials (standard Argon2id hash stored on server)
3. Server sends your encrypted CMK material (it cannot decrypt this)
4. Enter master password (client-side only)
5. Browser derives CMK from master password using Argon2id
6. CMK unlocked in memory for this session

## Master password unlock

After login, you must unlock with your master password to decrypt your CMK. This
happens every time you access the app (on page load or refresh). The master
password never leaves your device - all key derivation happens client-side.

The server never sees or stores your master password. It only has your CMK
encrypted with your master password, which it cannot decrypt.

See [Authentication](../security/authentication) for technical details on how
master password authentication works.

## Passkey unlock (trusted devices)

Typing your master password every time you access the app can be tedious,
especially on trusted devices like your personal laptop or phone. Passkey unlock
lets you use biometric authentication (Touch ID, Face ID, or Windows Hello)
instead.

Once you register a device, your CMK is encrypted with device-specific keys
stored in your device's secure hardware. This means you can unlock quickly with
your device's passkey while maintaining the same security level.

**How it works:**

1. First time: Login with credentials, unlock with master password
2. Register device: Browser generates passkey in your device's secure hardware
3. Next time: Login with credentials, unlock with passkey (no master password
   needed)

**Enhanced security:** Device passpasses derive encryption keys directly from
device secure hardware (TPM, Secure Enclave), providing stronger protection
against device cloning.

**Persistence:** Device credentials persist across logouts by default, allowing
passkey unlock without re-registration. You can enable "Clear on logout" in
Settings → Trusted Devices to remove credentials when logging out.

See [Trusted Devices](../configuration/trusted-devices) for setup instructions.

See [CMK Unlock](../security/cmk-unlock) for technical details on how device
unlock works.

## User management

Admin can manage users, set quotas, and enable/disable accounts. See
[User Management](../configuration/user-management) for admin features.
