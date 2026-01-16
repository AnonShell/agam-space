'use client';

import { useEffect, useState, useMemo } from 'react';
import { LayoutGrid, List, Trash2, SortAsc, ArrowUp, ArrowDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { emptyTrashApi, FileEntry, FolderEntry, loadTrashedItems } from '@agam-space/client';
import { ExplorerItem } from '@/components/explorer/explorer-item';
import { usePreferencesStore } from '@/store/preferences.store';
import { RestoreService } from '@/services/restore.service';
import { sortTrashItems } from '@/utils/sort-trash-items';

export default function TrashExplorerPage() {
  const [loading, setLoading] = useState(true);
  const [folders, setFolders] = useState<FolderEntry[]>([]);
  const [files, setFiles] = useState<FileEntry[]>([]);

  const {
    trash: prefs,
    setTrashView,
    setTrashSortBy,
    setTrashSortDir,
    setTrashGroupFolders,
  } = usePreferencesStore();

  // Sort and combine items based on preferences
  const sortedItems = useMemo(() => {
    return sortTrashItems(folders, files, prefs.sortBy, prefs.sortDir, prefs.groupFolders);
  }, [folders, files, prefs.sortBy, prefs.sortDir, prefs.groupFolders]);

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
      await RestoreService.emptyTrash(emptyTrashApi);
      refresh();
    } catch (err) {
      console.error('Failed to empty trash', err);
      toast.error('Failed to empty Trash.');
    }
  };

  const handleRestoreItem = async (itemId: string, isFolder: boolean, itemName: string) => {
    try {
      const item = isFolder ? folders.find(f => f.id === itemId) : files.find(f => f.id === itemId);

      if (!item) {
        toast.error('Item not found');
        return;
      }

      const result = await RestoreService.restoreItem({
        itemId,
        isFolder,
        itemName,
        parentId: item.parentId || null,
        existingItem: item,
      });

      if (result.success) {
        if (result.movedToRoot) {
          if (result.hasConflict) {
            toast.success(
              `Restored as "${result.finalName}" to root folder\n⚠️ Original location no longer exists`
            );
          } else {
            toast.success(
              `"${result.finalName}" restored to root folder\n⚠️ Original location no longer exists`
            );
          }
        } else {
          if (result.hasConflict) {
            toast.success(`Restored as "${result.finalName}" (name conflict resolved)`);
          } else {
            toast.success(`"${result.finalName}" restored successfully`);
          }
        }
      } else {
        toast.error('Failed to restore item');
      }

      refresh(); // Refresh trash view to remove restored item
    } catch (err) {
      console.error('Failed to restore item', err);

      const errorMessage = err instanceof Error ? err.message : 'Failed to restore item';
      toast.error(errorMessage);
    }
  };

  const itemCount = folders.length + files.length;

  if (loading) {
    return <div className='p-4 text-muted-foreground'>Loading...</div>;
  }

  return (
    <div className='flex flex-col h-full'>
      {/* Top bar */}
      <div className='flex justify-between items-center px-4 py-2 border-b bg-background'>
        <div className='text-sm text-muted-foreground'>
          {itemCount} item(s) in Trash. Items are auto-deleted after 30 days.
        </div>
        <div className='flex gap-2'>
          {/* Sort dropdown - only show in grid view */}
          {prefs.view === 'grid' && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant='ghost'
                  size='sm'
                  className='h-8 inline-flex items-center gap-2 leading-none'
                  title='Sort'
                >
                  <SortAsc className='w-4 h-4 mr-1 shrink-0' />
                  <span className='text-sm'>
                    {prefs.sortBy === 'name'
                      ? 'Name'
                      : prefs.sortBy === 'size'
                        ? 'Size'
                        : 'Modified'}
                  </span>
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent
                align='end'
                sideOffset={6}
                className='z-50 w-48 rounded-md border bg-white dark:bg-zinc-900 text-black dark:text-white shadow-md'
              >
                {/* Sort By Section */}
                <div className='px-2 py-1.5 text-xs font-semibold text-muted-foreground'>
                  Sort by
                </div>
                <DropdownMenuItem
                  onClick={() => setTrashSortBy('name')}
                  className={prefs.sortBy === 'name' ? 'bg-accent text-accent-foreground' : ''}
                >
                  Name
                  {prefs.sortBy === 'name' && <span className='ml-auto text-primary'>✓</span>}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setTrashSortBy('size')}
                  className={prefs.sortBy === 'size' ? 'bg-accent text-accent-foreground' : ''}
                >
                  Size
                  {prefs.sortBy === 'size' && <span className='ml-auto text-primary'>✓</span>}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setTrashSortBy('modified')}
                  className={prefs.sortBy === 'modified' ? 'bg-accent text-accent-foreground' : ''}
                >
                  Modified
                  {prefs.sortBy === 'modified' && <span className='ml-auto text-primary'>✓</span>}
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                {/* Sort Direction Section */}
                <div className='px-2 py-1.5 text-xs font-semibold text-muted-foreground'>
                  Sort direction
                </div>
                <DropdownMenuItem
                  onClick={() => setTrashSortDir('asc')}
                  className={prefs.sortDir === 'asc' ? 'bg-accent text-accent-foreground' : ''}
                >
                  {prefs.sortBy === 'name'
                    ? 'A → Z'
                    : prefs.sortBy === 'modified'
                      ? 'Old → New'
                      : 'Small → Large'}
                  {prefs.sortDir === 'asc' && <span className='ml-auto text-primary'>✓</span>}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setTrashSortDir('desc')}
                  className={prefs.sortDir === 'desc' ? 'bg-accent text-accent-foreground' : ''}
                >
                  {prefs.sortBy === 'name'
                    ? 'Z → A'
                    : prefs.sortBy === 'modified'
                      ? 'New → Old'
                      : 'Large → Small'}
                  {prefs.sortDir === 'desc' && <span className='ml-auto text-primary'>✓</span>}
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                {/* Group Folders Section */}
                <DropdownMenuItem
                  onClick={() => setTrashGroupFolders(!prefs.groupFolders)}
                  className={prefs.groupFolders ? 'bg-accent text-accent-foreground' : ''}
                >
                  Group Folders First
                  {prefs.groupFolders && <span className='ml-auto text-primary'>✓</span>}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* View toggle */}
          <Button
            variant='ghost'
            size='icon'
            onClick={() => setTrashView(prefs.view === 'grid' ? 'list' : 'grid')}
            title={prefs.view === 'grid' ? 'Switch to list view' : 'Switch to grid view'}
          >
            {prefs.view === 'grid' ? (
              <List className='w-5 h-5' />
            ) : (
              <LayoutGrid className='w-5 h-5' />
            )}
          </Button>

          {/* Empty trash */}
          <Button
            variant='ghost'
            className='text-destructive hover:bg-destructive/10 flex items-center gap-2'
            onClick={handleEmptyTrash}
          >
            <Trash2 className='w-4 h-4' />
            Empty Trash
          </Button>
        </div>
      </div>

      {/* Main view */}
      <main className='flex-1 overflow-y-auto bg-background'>
        {itemCount === 0 ? (
          <div className='flex flex-col items-center justify-center h-full text-center text-muted-foreground'>
            <Trash2 className='w-12 h-12 mb-4' />
            <h2 className='text-lg font-semibold'>Trash is empty</h2>
            <p className='text-sm max-w-sm mt-2'>
              Deleted files and folders will appear here. Items are permanently removed after 30
              days.
            </p>
          </div>
        ) : prefs.view === 'grid' ? (
          <div className='p-4 space-y-2'>
            <div className='grid [grid-template-columns:repeat(auto-fill,minmax(200px,1fr))] gap-4'>
              {sortedItems.map(item => (
                <ExplorerItem
                  key={item.id}
                  entry={item}
                  view='grid'
                  isTrashView
                  onRestore={() => handleRestoreItem(item.id, item.isFolder, item.name)}
                />
              ))}
            </div>
          </div>
        ) : (
          <>
            <div className='flex items-center h-9 px-4 pr-8 text-sm text-muted-foreground font-medium border-b bg-muted/40'>
              {/* column 1: icon space */}
              <div className='w-5' />

              {/* column 2: name */}
              <button
                onClick={() => {
                  if (prefs.sortBy === 'name') {
                    setTrashSortDir(prefs.sortDir === 'asc' ? 'desc' : 'asc');
                  } else {
                    setTrashSortBy('name');
                    setTrashSortDir('asc');
                  }
                }}
                className='flex-1 min-w-0 pl-2 text-left hover:text-foreground transition-colors flex items-center gap-1'
              >
                Name
                {prefs.sortBy === 'name' &&
                  (prefs.sortDir === 'asc' ? (
                    <ArrowUp className='w-3 h-3' />
                  ) : (
                    <ArrowDown className='w-3 h-3' />
                  ))}
              </button>

              {/* column 3: size */}
              <button
                onClick={() => {
                  if (prefs.sortBy === 'size') {
                    setTrashSortDir(prefs.sortDir === 'asc' ? 'desc' : 'asc');
                  } else {
                    setTrashSortBy('size');
                    setTrashSortDir('asc');
                  }
                }}
                className='w-24 sm:w-32 md:w-40 lg:w-48 xl:w-56 text-right hover:text-foreground transition-colors flex items-center justify-end gap-1 pr-6'
              >
                Size
                {prefs.sortBy === 'size' &&
                  (prefs.sortDir === 'asc' ? (
                    <ArrowUp className='w-3 h-3' />
                  ) : (
                    <ArrowDown className='w-3 h-3' />
                  ))}
              </button>

              {/* column 4: modified */}
              <button
                onClick={() => {
                  if (prefs.sortBy === 'modified') {
                    setTrashSortDir(prefs.sortDir === 'asc' ? 'desc' : 'asc');
                  } else {
                    setTrashSortBy('modified');
                    setTrashSortDir('asc');
                  }
                }}
                className='hidden sm:flex sm:w-40 md:w-52 lg:w-64 xl:w-72 text-right hover:text-foreground transition-colors items-center justify-end gap-1 pr-6 text-xs'
              >
                Modified
                {prefs.sortBy === 'modified' &&
                  (prefs.sortDir === 'asc' ? (
                    <ArrowUp className='w-3 h-3' />
                  ) : (
                    <ArrowDown className='w-3 h-3' />
                  ))}
              </button>

              {/* column 5: actions space */}
              <div className='w-12 sm:w-16 md:w-20 lg:w-24' />
            </div>
            <div className='divide-y'>
              {sortedItems.map(item => (
                <ExplorerItem
                  key={item.id}
                  entry={item}
                  view='list'
                  isTrashView
                  onRestore={() => handleRestoreItem(item.id, item.isFolder, item.name)}
                />
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
