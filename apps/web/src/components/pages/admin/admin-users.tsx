'use client';

import { Button } from '@/components/ui/button';
import { useEffect, useMemo, useState } from 'react';
import { UsersArray, UserStatus } from '@agam-space/shared-types';
import { fetchUsers } from '@agam-space/client';
import { formatLastSeen } from '@/utils/date-formatter';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal } from 'lucide-react';
import { useAuth } from '@/store/auth';

export function AdminUserList() {

  const [users, setUsers] = useState<UsersArray>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const currentUser = useAuth((state => state.user));

  const load = useMemo(
    () => async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchUsers();
        setUsers(data ?? []);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load users');
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await load();
      if (cancelled) return;
    })();
    return () => {
      cancelled = true;
    };
  }, [load]);

  const StatusBadge = ({ status }: { status: 'active' | 'disabled' | 'deleted' }) => {
    const map: Record<typeof status, { text: string; classes: string }> = {
      active:   { text: 'Active',   classes: 'bg-emerald-100 text-emerald-700' },
      disabled: { text: 'Disabled', classes: 'bg-amber-100 text-amber-700' },
      deleted:  { text: 'Deleted',  classes: 'bg-red-100 text-red-700' },
    };

    const { text, classes } = map[status];
    return (
      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${classes}`}>
      {text}
    </span>
    );
  };

  const changeUserStatus = async (userId: string, status: UserStatus) => {
    try {
      // Call your API to change user status here
      // await api.changeUserStatus(userId, status);
      console.log(`Changed user ${userId} status to ${status}`);
      await load(); // Reload users after changing status
    } catch (error) {
      console.error('Failed to change user status:', error);
      setError('Failed to change user status');
    }
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-2">
        <h2 className="text-xl font-semibold">User Management</h2>
        <Button onClick={load} disabled={loading} size="sm" variant="secondary">
          {loading ? 'Refreshing…' : 'Refresh'}
        </Button>
      </div>

      <div className="border rounded-xl overflow-hidden">
        {error ? (
          <div className="p-4 text-sm text-red-600 bg-red-50">{error}</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-muted text-muted-foreground">
            <tr>
              <th className="text-left px-4 py-2">Username</th>
              <th className="text-left px-4 py-2">Email</th>
              <th className="text-left px-4 py-2">Role</th>
              <th className="text-left px-4 py-2">Status</th>
              <th className="text-left px-4 py-2">Last Login</th>
              <th className="text-left px-4 py-2">Actions</th>
            </tr>
            </thead>
            <tbody>
            {loading && users.length === 0 ? (
              <tr>
                <td className="px-4 py-6 text-muted-foreground" colSpan={6}>
                  Loading users…
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td className="px-4 py-6 text-muted-foreground" colSpan={6}>
                  No users found
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id} className="border-t hover:bg-muted/20">
                  <td className="px-4 py-2">{user.username} {currentUser?.id === user.id ? '(You) ' : ''}  </td>
                  <td className="px-4 py-2">{user.email}</td>
                  <td className="px-4 py-2 capitalize">{user.role}</td>
                  <td className="px-4 py-2 space-x-2">
                    <StatusBadge status={user.status as 'active' | 'disabled' | 'deleted'} />
                  </td>
                  <td className="px-4 py-2">
                    {(() => {
                      const { relative, exact } = formatLastSeen(user.lastLoginAt, 'en');
                      return (
                        <span title={exact ?? undefined} className="whitespace-nowrap">
                        {relative}
                      </span>
                      );
                    })()}
                  </td>
                  <td className="px-4 py-2">
                    {user.status === 'deleted' || currentUser?.id === user.id ? (
                      <div className="flex items-center justify-center h-8 w-8">
                        <span className="text-muted-foreground"></span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Actions">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            align="end"
                            className="w-44 bg-white dark:bg-neutral-900 border rounded-md shadow-md"
                          >
                            {user.status === 'active' ? (
                              <DropdownMenuItem
                                onClick={() => changeUserStatus(user.id, UserStatus.DISABLED)}
                              >
                                Disable
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem
                                onClick={() => changeUserStatus(user.id, UserStatus.ACTIVE)}
                              >
                                Enable
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              className="text-red-600 focus:text-red-600"
                              onClick={() => changeUserStatus(user.id, UserStatus.DELETED)}
                            >
                              Delete…
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
