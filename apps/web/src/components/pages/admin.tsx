'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { AdminUserList } from '@/components/pages/admin/admin-users';
import { usePathname } from 'next/navigation';
import Link from 'next/link';

const sections = [
  { label: 'Users', href: '/admin/users' },
  { label: 'System', href: '/admin/system' },
  // just add more here later
];

export default function AdminPage() {
  let pathname = usePathname();

  if (!pathname || pathname === '/admin/') {
    pathname = '/admin/users'; // default to users if no path
  }

  const [activeSection, setActiveSection] = useState(sections.find((s) => pathname.startsWith(s.href)));

  // // find which section matches current path
  // const active = sections.find((s) => pathname.startsWith(s.href));

  return (
    <div className="flex h-full">
      {/* Sidebar */}
      <div className="w-48 border-r p-4 space-y-2">
        {sections.map((section) => (
          <Button
            key={section.label}
            variant={activeSection?.href === section.href ? 'default' : 'ghost'}
            className="w-full justify-start"
            onClick={() => {
              setActiveSection(section);
            }}
          >
            {section.label}
          </Button>
        ))}
      </div>

      {/* Main content */}
      <div className="flex-1 p-6">
        {activeSection?.label === 'Users' && <AdminUserList />}

        {activeSection?.label === 'System' && (
          <div>
            <h2 className="text-xl font-semibold mb-4">System Configuration</h2>
            <p className="text-muted-foreground">Coming soon: tweak global app settings or feature flags.</p>
          </div>
        )}
      </div>
    </div>
  );
}
