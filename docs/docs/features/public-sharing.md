# Public Sharing

Share files and folders with anyone via a link. Recipients don't need an
account.

## Creating a Share

1. Right-click any file or folder in the explorer
2. Select "Share" from the menu
3. Configure share options:
   - **Password protection** (optional) - Require a password to access
   - **Expiration** (optional) - When the share auto-expires
4. Click "Create Share"
5. Copy the share URL

**Important:** The URL is shown only once. It contains the encryption key needed
to decrypt the content.

## Share Options

### Password Protection

Add an extra password layer. Recipients must enter the password to access
content.

- Optional but recommended for sensitive data
- Password never stored - only a hash
- Wrong password = access denied

### Expiration

Shares auto-expire after the set duration. After expiry, the share link stops
working.

**Duration options:**

- Minutes (for quick sharing)
- Hours (same-day sharing)
- Days (default: 2 days)

You can disable expiration, but this creates permanent shares. Not recommended
for security.

**What happens when a share expires:**

- Share link stops working
- Recipients see "Share not found or expired"
- Share auto-deleted from server
- You can see expiry time in Settings → Public Shares

## Accessing a Share

Recipients open the share URL in their browser:

1. Browser loads the share page
2. If password-protected, they enter the password
3. Content decrypts in their browser
4. For files: preview or download
5. For folders: browse and download files

**For password-protected shares:**

- 10 password attempts per minute (rate limited)
- After that, temporary lockout to prevent brute force

## Managing Your Shares

View and manage all shares in **Settings → Public Shares**.

**Share list shows:**

- Share ID (last part of URL)
- Type (file or folder)
- Created date
- Expiration time
- Actions (revoke)

### Revoking Shares

Click "Revoke" to immediately invalidate a share:

- Share URL stops working instantly
- Recipients lose access
- Share deleted from server
- Cannot be undone

Use this if:

- You shared the wrong file
- URL leaked to wrong people
- No longer want to share

## Security Considerations

### The URL Contains the Key

The share URL has two parts:

- Domain + share ID: `https://your-domain.com/public/share?sid=abc123`
- Encryption key: `#def456` (after the # symbol)

The part after `#` is the client-side encryption key. Never sent to the server.

**What this means:**

- Anyone with the full URL can decrypt content
- Treat share URLs like passwords
- Send via secure channels (Signal, encrypted email)
- Don't post publicly unless you want public access

### Server Cannot Decrypt

The server stores half the encryption key. The URL contains the other half. Both
needed to decrypt.

- Even if the server is compromised, attackers cannot decrypt shares without
  URLs
- Password protection adds another layer of security

### Rate Limiting

To prevent brute force attacks:

- **Share metadata:** 30 requests/minute
- **Password attempts:** 10 requests/minute
- **Content/downloads:** 100 requests/minute

If you hit the limit, wait a minute and try again.
