---
sidebar_position: 3
---

# Recovery Key

How to recover access to your encrypted data if you lose your master password.

## What is a Recovery Key?

A recovery key is a 256-bit random key generated during account setup. It can
decrypt your CMK if you forget your master password.

**Think of it as a backup key to your encrypted data.**

## When You'll Need It

- Forgot your master password
- Master password no longer works (typo when setting it up)
- Need to access data but password manager lost the password

**Important:** Without master password OR recovery key, your data is permanently
unrecoverable. No one can help you - not even the server admin.

## How It Works

**Generation:**

- Random 256-bit key generated client-side
- Recovery key encrypts your CMK
- Encrypted CMK stored on server
- Recovery key shown to you once

**Recovery:**

- Enter recovery key
- Decrypts CMK
- Access to encrypted files restored

## Where to Find It

**First time:** Displayed during setup after setting master password

**Later:** Settings → Security → Recovery Key (requires master password to view)

**Security:** Master password required to view recovery key prevents
unauthorized access if someone gains access to your logged-in session.

## How to Save It

Store in a secure location, different from where you keep your master password.

## Security Model

**What server stores:**

- Your CMK encrypted with recovery key
- Server cannot decrypt without the recovery key (which you have)

**What you have:**

- Recovery key (random, never sent to server after setup)

**Protection:**

- Server breach → Attacker gets encrypted CMK but not recovery key
- Recovery key theft → Attacker cannot access server data without valid login
- Both required: Valid account access + recovery key to decrypt CMK

**Trade-off:**

Recovery key is powerful - anyone with your recovery key and account access can
decrypt all your files. This is why you must store it securely.

## What If You Lose Both?

If you lose both master password AND recovery key, your data is permanently
unrecoverable.

This is zero-knowledge encryption working as designed - no password reset, no
admin recovery, no backdoor.

## Further Reading

- [Encryption](./encryption.md) - How CMK encrypts data
