---
sidebar_position: 1
---

# Authentication

How Agam Space handles user authentication while maintaining zero-knowledge
encryption.

## Two-Password System

Agam Space uses two separate passwords for different purposes:

1. **Login password** - Authenticates you to the server
2. **Master password** - Derives encryption keys

**Login password:**

- Hashed with Argon2id on server
- Used for authentication and session creation

**Master password:**

- Never sent to server
- Used only in browser to derive CMK

**Why separate:**

- Two-layer security: CMK alone cannot download encrypted files without valid
  login session, and login credentials alone cannot decrypt files without master
  password
- Can change login password without re-encrypting all data

## Login Flow

1. User enters email and login password
2. Server verifies password hash, creates session
3. Server sends encrypted CMK to client
4. Client prompts for master password
5. Client derives key from master password, decrypts CMK
6. CMK loaded in memory, session active

Server authenticates user. Client decrypts data.

**Next:** After login, unlock your CMK to decrypt files. See
[CMK Unlock](./cmk-unlock.md).

## Login Session Security

**Purpose:** Authentication and API access control

**Storage:**

- Session token in HTTP-only cookie
- Session record in database (token stored as SHA-256 hash)

**Lifetime:**

- Configurable (default: 7 days)
- Server-side validation on every API request
- Invalidated on logout

**Security:**

- Prevents unauthorized API requests
- Token hashed in database (prevents session hijacking if DB compromised)
- HTTP-only cookie (not accessible to JavaScript)

## SSO Authentication

Optional single sign-on with OIDC providers (Authelia, Authentik, Keycloak,
etc.).

SSO handles server authentication only. Master password still required for
encryption.

## Further Reading

- [Unlocking Master Key](./cmk-unlock.md) - How to unlock encryption keys
- [Recovery](./recovery.md) - Recovery key usage
- [Encryption](./encryption.md) - How CMK encrypts data
