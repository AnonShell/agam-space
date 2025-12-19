'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/store/auth';

export function AccountSettingsSection() {
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const user = useAuth((s) => s.user);

  const handlePasswordChange = async () => {
    setIsSubmitting(true);
    try {
      // TODO: call API to update password
      console.log('Changing password...');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Account Settings</h2>

      {/* Account Info Card */}
      <Card>
        <CardHeader>
          <CardTitle>Account Info</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <div className="grid grid-cols-[150px_1fr] gap-y-2 gap-x-4">
            <span className="text-foreground font-medium">Username</span>
            <span className="truncate">{user?.username}</span>
            <span className="text-foreground font-medium">Email</span>
            <span className="truncate">{user?.email}</span>
            <span className="text-foreground font-medium">User ID</span>
            <span className="truncate">{user?.id}</span>
            <span className="text-foreground font-medium">Account Created</span>
            <span className="truncate">{user?.createdAt ? new Date(user.createdAt).toLocaleString() : '-'}</span>
            <span className="text-foreground font-medium">Last Login</span>
            <span className="truncate">{user?.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : '-'}</span>
            <span className="text-foreground font-medium">Status</span>
            <span className="truncate">{user?.status || '-'}</span>
            <span className="text-foreground font-medium">Role</span>
            <span className="truncate">{user?.role || '-'}</span>
            <span className="text-foreground font-medium">Email Verified</span>
            <span className="truncate">{user?.isEmailVerified ? 'Yes' : 'No'}</span>
            <span className="text-foreground font-medium">OIDC Provider</span>
            <span className="truncate">{user?.oidcProvider || '-'}</span>
            <span className="text-foreground font-medium">OIDC Subject</span>
            <span className="truncate">{user?.oidcSubject || '-'}</span>
          </div>
        </CardContent>
      </Card>

      {/* Change Password Card */}
      {/*
      <Card>
        <CardHeader>
          <CardTitle>Change Login Password</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!showPasswordForm ? (
            <Button variant="outline" onClick={() => setShowPasswordForm(true)}>
              Change Password
            </Button>
          ) : (
            <form
              className="space-y-4 max-w-md"
              onSubmit={(e) => {
                e.preventDefault();
                handlePasswordChange();
              }}
            >
              <div className="space-y-2">
                <Label htmlFor="current">Current Password</Label>
                <Input
                  id="current"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new">New Password</Label>
                <Input
                  id="new"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm">Confirm New Password</Label>
                <Input
                  id="confirm"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
      */}
    </div>
  );
}
