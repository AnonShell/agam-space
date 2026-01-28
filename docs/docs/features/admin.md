# Admin Panel

Admin and Owner users can manage the Agam Space instance through the admin
panel.

## User management

View and manage all users on the instance.

**Features:**

- View all users with current status and storage usage
- Enable/disable user accounts
- Delete users (7-day grace period before deletion)
- View user quota usage and limits
- Create and manage invite codes for controlled user registration

**Note:** User data deletion after the 7-day grace period is not yet
implemented. Currently, disabling accounts prevents access but data remains on
the server.

See [User Management](../configuration/user-management) for detailed
instructions.

## Quota management

Set storage quotas for individual users.

**Features:**

- Set per-user storage quotas
- Unlimited storage option available
- Real-time quota usage tracking
- Prevent uploads when quota exceeded

Default quota for new users is configurable via environment variables. See
[Configuration Reference](../configuration/configuration-reference) for details.

## Access control

Only Owner and Admin users can access the admin panel.

- **Owner** - First user to register, full admin access
- **Admin** - Users promoted by Owner, can manage users and quotas
- **Regular users** - Cannot access admin panel

See [Account - User roles](./account#user-roles) for more details on user roles.
