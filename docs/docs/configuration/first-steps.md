---
sidebar_position: 1
---

# First Steps

Quick setup after installing Agam Space.

## Create Your Account

1. Open Agam Space
   - With reverse proxy: `https://files.yourdomain.com`
   - Without: `http://localhost:3331`

2. Click **Sign Up**

3. Enter email and login password

4. Set your **master password**
   - This encrypts all your files
   - Choose a strong passphrase (20+ characters)
   - Never stored on server

5. **Save your recovery key**
   - Shown during setup
   - Also accessible later in Settings
   - Write it down or store in password manager

Done! You're ready to upload files.

## Disable Public Signups

After creating your admin account, prevent others from signing up (if needed):

Edit `docker-compose.yml`:

```yaml
ALLOW_NEW_SIGNUP: 'false'
```

Restart:

```bash
docker-compose restart agam
```

You can re-enable later to invite family/friends.

## Test File Upload

Verify everything works:

1. Click **New Folder** → create a test folder
2. Click **Upload** → upload a small file
3. Download the file back
4. Delete the file (moves to trash)
5. Empty trash

If all steps work, installation successful! ✅

## What's Next?

Configure additional features:

🔧 **[Single Sign-On](./sso.md)** - Configure Authelia, Authentik, or cloud
providers

🔐 **[Trusted Devices](./trusted-devices.md)** - Unlock with Touch ID/Face ID

👥 **[User Management](./user-management.md)** - Add users and set storage
quotas

And don't forget:

💾 **[Set up backups](../installation/backups.md)** - Important! Automate your
backups
