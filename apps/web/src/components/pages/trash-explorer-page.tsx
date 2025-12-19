'use client';

import { useEffect, useState } from 'react';
import { LayoutGrid, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { emptyTrashApi, FileEntry, FolderEntry, loadTrashedItems } from '@agam-space/client';
import { ExplorerItem } from '@/components/explorer/explorer-item';
import { useUserQuotaStore } from '@/store/user-quota.store';

export default function TrashExplorerPage() {
  const [loading, setLoading] = useState(true);
  const [folders, setFolders] = useState<FolderEntry[]>([]);
  const [files, setFiles] = useState<FileEntry[]>([]);
  const [view, setView] = useState<'grid' | 'list'>('grid');

  const refresh = async () => {
    setLoading(true);
    try {
      const { folders, files } = await loadTrashedItems();
      setFolders(folders);
      setFiles(files);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const handleEmptyTrash = async () => {
    try {
      const { deletedCount } = await emptyTrashApi();
      toast.success(
        deletedCount > 0
          ? `Permanently deleted ${deletedCount} item(s) from Trash.`
          : 'Trash is already empty.',
      );
      refresh();
      useUserQuotaStore.getState().refresh();
    } catch (err) {
      console.error('Failed to empty trash', err);
      toast.error('Failed to empty Trash.');
    }
  };

  const itemCount = folders.length + files.length;

  if (loading) {
    return <div className="p-4 text-muted-foreground">Loading...</div>;
  }

  return (
    <div className="flex flex-col h-full">
      {/* Top bar */}
      <div className="flex justify-between items-center px-4 py-2 border-b bg-background">
        <div className="text-sm text-muted-foreground">
          {itemCount} item(s) in Trash. Items are auto-deleted after 30 days.
        </div>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setView(view === 'grid' ? 'list' : 'grid')}
            title={view === 'grid' ? 'Switch to list view' : 'Switch to grid view'}
          >
            <LayoutGrid className="w-5 h-5" />
          </Button>
          <Button
            variant="ghost"
            className="text-destructive hover:bg-destructive/10 flex items-center gap-2"
            onClick={handleEmptyTrash}
          >
            <Trash2 className="w-4 h-4" />
            Empty Trash
          </Button>
        </div>
      </div>

      {/* Main view */}
      <main className="flex-1 overflow-y-auto bg-background">
        {itemCount === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
            <Trash2 className="w-12 h-12 mb-4" />
            <h2 className="text-lg font-semibold">Trash is empty</h2>
            <p className="text-sm max-w-sm mt-2">
              Deleted files and folders will appear here. Items are permanently removed after 30 days.
            </p>
          </div>
        ) : view === 'grid' ? (
          <div className="p-4 space-y-2">
            <div className="grid [grid-template-columns:repeat(auto-fill,minmax(200px,1fr))] gap-4">
              {folders.map((folder) => (
                <ExplorerItem
                  key={folder.id}
                  entry={folder}
                  view="grid"
                  isTrashView
                />
              ))}
              {files.map((file) => (
                <ExplorerItem
                  key={file.id}
                  entry={file}
                  view="grid"
                  isTrashView
                />
              ))}
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center h-9 px-4 text-sm text-muted-foreground font-medium border-b bg-muted/40">
              <div className="w-5" />
              <div className="flex-1 pl-2">Name</div>
              <div className="w-32 text-right">Size</div>
              <div className="w-48 text-right">Deleted</div>
            </div>
            <div className="divide-y">
              {folders.map((folder) => (
                <ExplorerItem
                  key={folder.id}
                  entry={folder}
                  view="list"
                  isTrashView
                />
              ))}
              {files.map((file) => (
                <ExplorerItem
                  key={file.id}
                  entry={file}
                  view="list"
                  isTrashView
                />
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
