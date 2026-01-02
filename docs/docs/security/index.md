---
sidebar_position: 5
---

# Security

Agam Space uses zero-knowledge end-to-end encryption. The server cannot decrypt
your data.

**Trade-off:** Lost master password + recovery key = permanent data loss. No
password reset, no admin recovery.

## Trust Model

**Important:** There's a difference between **protocol-level zero-knowledge**
(cryptographically secure) and **implementation-level trust** (you must trust
the server to deliver unmodified code).

Agam Space is zero-knowledge by protocol - the server cannot decrypt your data.
But like all web apps, you must trust it to deliver correct JavaScript.

**Read the full explanation:**
[Understanding Zero-Knowledge in Web Apps](./trust-model.md)

## Security Topics

- **[Authentication](./authentication.md)** - Login, passwords, and sessions
- **[Encryption](./encryption.md)** - Algorithms, key hierarchy, and how files
  are encrypted
- **[Unlocking Master Key](./cmk-unlock.md)** - Master password, trusted
  devices, or sessionStorage
- **[Recovery](./recovery.md)** - Recovery key as backup if you forget master
  password

## Auditing

Not professionally audited. Personal project for learning and self-hosting. Use
at your own risk, keep backups.

## Reporting Security Issues

Found a vulnerability? Report privately to: **security.agamspace@proton.me**

Do NOT report security vulnerabilities through public GitHub issues.

Thank you for helping improve security for the community.

## Further Reading

- [Architecture](../architecture) - Technical implementation details
- [FAQ](../faq#security-questions) - Common questions
