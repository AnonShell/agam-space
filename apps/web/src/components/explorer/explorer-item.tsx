'use client';

import { useRouter } from 'next/navigation';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import { cn } from '@/lib/utils';
import { Folder } from 'lucide-react';
import { ClientRegistry, ContentEntry, FileEntry } from '@agam-space/client';
import { getFileIconV2 } from '@/lib/file-mime-icon';
import { formatBytes } from '@/utils/file';
import { toast } from 'sonner';
import { useDownloadStore } from '@/store/download-store';
import { useState } from 'react';
import { RenameDialog } from '@/components/explorer/rename-dialog';

type ExplorerItemProps = {
  entry: ContentEntry;
  view: 'grid' | 'list';
  href?: string;
  selected?: boolean;
  multiSelect?: boolean;
  isTrashView?: boolean;
  onClick?: (e: React.MouseEvent) => void;
  onTrash?: (id: string, isFolder: boolean) => void;
  onRestore?: () => void;
  onDeletePermanent?: () => void;
  onDoubleClick?: () => void;
  checkIfNameExists?: (id: string, isFolder: boolean, newName: string) => boolean;
  onRename?: (id: string, isFolder: boolean, newName: string) => void;
  onMove?: (entry: ContentEntry) => void;
  onContextOpen?: () => void; // Notify parent when context menu opens
  onContextClose?: () => void; // Notify parent when context menu closes
  onRecomputeSize?: (entry: ContentEntry) => Promise<void> | void;

  // selectedId?: string | null;
  // setSelectedId?: (id: string | null) => void;
  // onToggleSelect?: () => void;
};

export function ExplorerItem({
  entry,
  view,
  href,
  // setSelectedId,
  onTrash,
  multiSelect = false,
  selected = false,
  // onToggleSelect,
  isTrashView = false,
  onRestore,
  onDeletePermanent,
  onClick = () => {},
  onDoubleClick,
  checkIfNameExists,
  onRename = () => {},
  onMove = () => {},
  onContextOpen = () => {},
  onContextClose = () => {},
  onRecomputeSize = async () => {},
}: ExplorerItemProps) {
  const router = useRouter();

  const [showRenameDialog, setShowRenameDialog] = useState(false);

  const icon = entry.isFolder ? (
    <Folder className={cn(view === 'grid' ? 'w-6 h-6' : 'w-5 h-5', 'text-yellow-500')} />
  ) : (
    getFileIconV2(entry.mime)
  );

  const fileSizeText = !entry.isFolder && entry.size ? formatBytes(entry.size) : null;

  const handleDownload = async () => {
    try {
      const fileEntry = entry as FileEntry;
      const item = ClientRegistry.getDownloadManager().enqueue(fileEntry);

      useDownloadStore.getState().addDownload({
        id: item.id,
        fileName: fileEntry.name,
        totalBytes: fileEntry.size,
        downloadedBytes: 0,
        progress: 0,
        status: 'pending',
      });
    } catch (err) {
      console.error(err);
      toast.error('Download failed');
    }
  };

  const content =
    view === 'grid' ? (
      <div
        onClick={e => {
          e.preventDefault(); // ✅ stop browser default
          e.stopPropagation(); // ✅ prevent bubbling
          onClick?.(e);
        }}
        className={cn(
          'select-none transition-colors duration-100 cursor-pointer',
          view === 'grid'
            ? 'relative flex flex-col items-center justify-center gap-2 p-4 border rounded-lg'
            : 'flex items-center h-9 px-4 text-sm',
          selected
            ? 'bg-primary/10 border border-primary text-primary'
            : 'bg-muted/50 hover:bg-muted'
        )}
      >
        {icon}
        <div className='truncate w-full text-center font-medium text-sm text-foreground'>
          {entry.name}
        </div>
        {!entry.isFolder && entry.size && (
          <span className='text-[10px] text-muted-foreground'>{formatBytes(entry.size)}</span>
        )}
      </div>
    ) : (
      <div
        className={cn(
          'select-none transition-colors duration-100 cursor-pointer flex items-center h-9 px-4 text-sm ',
          selected
            ? 'bg-primary/10 border border-primary text-primary'
            : 'bg-muted/50 hover:bg-muted'
        )}
        onClick={e => {
          e.preventDefault(); // ✅ stop browser default
          e.stopPropagation(); // ✅ prevent bubbling
          onClick?.(e);
        }}
      >
        {/* column 1: icon */}
        <div className='w-5 text-yellow-500'>{icon}</div>

        {/* column 2: name */}
        <div className='flex-1 pl-2 truncate'>{entry.name}</div>

        {/* column 3: size */}
        <div className='w-32 text-right text-muted-foreground'>
          {!entry.isFolder && entry.size ? formatBytes(entry.size) : ''}
        </div>

        {/* column 4: modified */}
        <div className='w-48 text-right text-muted-foreground text-xs'>
          {entry.updatedAt ? formatDate(entry.updatedAt) : ''}
        </div>
      </div>
    );

  return (
    <>
      <ContextMenu
        onOpenChange={open => {
          if (open) {
            onContextOpen?.(); // Notify parent
          } else {
            onContextClose?.(); // Ask parent to maybe clear
          }
        }}
      >
        <ContextMenuTrigger asChild>
          <div
            onDoubleClick={() => {
              if (entry.isFolder && href) router.push(href);
              else if (!entry.isFolder) onDoubleClick?.();
            }}
            className='cursor-pointer'
          >
            {content}
          </div>
        </ContextMenuTrigger>

        <ContextMenuContent className='w-48 bg-white dark:bg-zinc-900 text-black dark:text-white border shadow-md rounded-md z-50'>
          {isTrashView ? (
            <>
              <ContextMenuItem onClick={onRestore}>Restore</ContextMenuItem>
              <ContextMenuItem onClick={onDeletePermanent} className='text-destructive'>
                Delete permanently
              </ContextMenuItem>
            </>
          ) : (
            <>
              {entry.isFolder && (
                <ContextMenuItem onClick={() => href && window.open(href, '_blank')}>
                  Open in New Tab
                </ContextMenuItem>
              )}
              {!entry.isFolder && (
                <ContextMenuItem onClick={handleDownload}>Download</ContextMenuItem>
              )}
              <ContextMenuSeparator />
              <ContextMenuItem onClick={() => setShowRenameDialog(true)}>Rename</ContextMenuItem>
              <ContextMenuItem onClick={() => onMove(entry)}>Move</ContextMenuItem>
              {entry.isFolder && (
                <ContextMenuItem onClick={() => onRecomputeSize(entry)}>
                  Refresh size
                </ContextMenuItem>
              )}
              <ContextMenuItem
                onClick={() => onTrash?.(entry.id, entry.isFolder)}
                className='text-destructive'
              >
                Trash
              </ContextMenuItem>
            </>
          )}
        </ContextMenuContent>
      </ContextMenu>
      <RenameDialog
        open={showRenameDialog}
        entryId={entry.id}
        isFolder={entry.isFolder}
        currentName={entry.name}
        onClose={() => setShowRenameDialog(false)}
        onRename={onRename}
        checkNameExists={checkIfNameExists ?? (() => true)}
      />
    </>
  );
}

// helper
function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(date));
}
