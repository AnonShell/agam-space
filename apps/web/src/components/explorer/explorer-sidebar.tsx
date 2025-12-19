// components/layout/explorer-sidebar-base.tsx

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Folder, Trash2 } from "lucide-react";
import { UserQuotaFooter } from '@/components/explorer/usage-quota-footer';

interface ExplorerSidebarBaseProps {
  onNavigate?: () => void;
}

export function ExplorerSidebarBase({ onNavigate }: ExplorerSidebarBaseProps) {
  const pathname = usePathname();

  return (
    <div className="flex flex-col h-full">
      <nav className="space-y-1 text-sm">
        <Link
          href="/explorer"
          onClick={onNavigate}
          className={cn(
            'flex items-center gap-2 px-3 py-2 rounded-md transition-colors',
            pathname.startsWith('/explorer')
              ? 'bg-muted font-medium'
              : 'hover:bg-muted text-muted-foreground'
          )}
        >
          <Folder className="w-4 h-4" />
          <span>My Files</span>
        </Link>

        <Link
          href="/trash"
          onClick={onNavigate}
          className={cn(
            'flex items-center gap-2 px-3 py-2 rounded-md transition-colors',
            pathname.startsWith('/trash')
              ? 'bg-muted font-medium'
              : 'hover:bg-muted text-muted-foreground'
          )}
        >
          <Trash2 className="w-4 h-4" />
          <span>Trash</span>
        </Link>
      </nav>
      <div className="mt-auto">
        <UserQuotaFooter />
      </div>
    </div>
  );
}
