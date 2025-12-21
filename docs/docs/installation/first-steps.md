---
sidebar_position: 3
---

# First Steps

What to do after installing Agam Space.

## Create Admin Account

After installation, create your first user (becomes admin):

1. Open your Agam Space URL
   - With reverse proxy: `https://files.yourdomain.com`
   - Without reverse proxy: `http://localhost:3331`

2. Click **Sign Up**

3. Enter your email and password
   - This is your **login password** (for authentication)
   - Choose a strong password

4. After login, set your **master password**
   - This is separate from your login password
   - Encrypts all your files
   - **Never stored on server**
   - Choose a strong passphrase (20+ characters recommended)

5. **Save your recovery key**
   - Displayed once during setup
   - Write it down or store in password manager
   - Can also access later in Settings
   - Without recovery key + master password, data is unrecoverable

6. Done! You're now logged in and can upload files

## Disable New Signups

After creating your admin account, prevent others from signing up:

Edit `docker-compose.yml`:

```bash
nano docker-compose.yml
```

Change:

```yaml
ALLOW_NEW_SIGNUP: 'false'
```

Restart:

```bash
docker-compose restart agam
```

You can re-enable later if you want to invite family/friends.

## Configure CORS (Production)

For production, set specific origin instead of wildcard:

Edit `docker-compose.yml`:

```yaml
CORS_ORIGIN: 'https://files.yourdomain.com'
```

Restart:

```bash
docker-compose restart agam
```

## Add More Users

If you want to add users later:

1. Re-enable signups temporarily:

   ```yaml
   ALLOW_NEW_SIGNUP: 'true'
   ```

2. Restart: `docker-compose restart agam`

3. Share the signup link with the person

4. After they sign up, disable signups again

**Note:** Each user has completely separate encrypted storage. Users cannot see
each other's files.

## Set Storage Quotas

By default, each user gets 10GB storage quota.

To change quotas, you'll need to update the database directly (admin UI coming
soon):

```bash
# Connect to database
docker exec -it agam-space-postgres-1 psql -U postgres -d agam_space

# View current quotas
SELECT email, storage_quota FROM users;

# Set quota for specific user (in bytes, 50GB example)
UPDATE users SET storage_quota = 53687091200 WHERE email = 'user@example.com';

# Set unlimited quota
UPDATE users SET storage_quota = NULL WHERE email = 'user@example.com';

# Exit
\q
```

## Test File Upload

Verify everything works:

1. Click **New Folder** and create a test folder
2. Click **Upload** and upload a small file
3. Download the file back
4. Delete the file (moves to trash)
5. Empty trash

If all steps work, your installation is successful! ✅

## Register Trusted Device (Optional)

For convenience, register your current device for biometric unlock:

1. Go to **Settings** → **Security**
2. Click **Register Device**
3. Follow the WebAuthn prompt (Touch ID, Face ID, Windows Hello)
4. Next time you login, unlock with biometric instead of typing master password

Only works on HTTPS (not localhost). Each device must be registered separately.

## Next Steps

💾 **[Set up backups](../installation/backups.md)** - Automate database and file
backups (important!)

🚀 **[Configuration](../configuration/index.md)** - Configure SSO, trusted
devices, and more

## Common Issues

**Can't access after setup:**

- Check firewall allows port 80/443
- Verify DNS points to your server
- Check reverse proxy configuration

**Master password doesn't work:**

- Master password is case-sensitive
- Make sure you're entering the exact password from setup
- Use recovery key if forgotten

**Storage quota exceeded immediately:**

- Default 10GB quota might be too small
- Increase quota using SQL commands above

**Biometric unlock not available:**

- Requires HTTPS (doesn't work on http://localhost)
- Device must support WebAuthn
- Browser must support WebAuthn (Chrome, Firefox, Safari)
