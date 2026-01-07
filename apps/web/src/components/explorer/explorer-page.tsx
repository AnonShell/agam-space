'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  ArrowRightLeft,
  ChevronDown,
  ChevronUp,
  Download,
  LayoutGrid,
  RefreshCw,
  SortAsc,
  Trash,
} from 'lucide-react';
import {
  ClientRegistry,
  ContentEntry,
  contentTreeStore,
  ContentTreeViewModel,
  FileEntry,
  FolderContentNode,
  FolderEntry,
  renameFile,
  renameFolder,
  trashFileApi,
  trashFilesApi,
  trashFolderApi,
  trashFoldersApi,
} from '@agam-space/client';
import { EmptyFolder } from '@/components/empty-states/empty-folder';
import { NewFolderDialog } from '@/components/folder/new-folder-dialog';
import { ExplorerItem } from '@/components/explorer/explorer-item';
import { toast } from 'sonner';
import { FileUploadButton } from '@/components/upload/file-upload-button';
import { useExplorerRefreshStore } from '@/store/explorer-refresh-store';
import { FileDropZone } from '@/components/upload/file-drop-zone';
import { useUploadStore } from '@/store/upload-store';
import { FilePreviewModal } from '@/components/file-preview/file-preview-modal';
import { MoveDialog } from '@/components/explorer/move-dialog';
import { ExplorerBreadcrumb } from '@/components/explorer/explorer-breadcrumb';
import { WebUploadService } from '@/services/web-upload-files.service';
import { WebDownloadFilesService } from '@/services/web-download-files.service';
import { ExplorerPageService } from '@/services/explorer-page.service';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { usePreferencesStore } from '@/store/preferences.store';

type ExplorerState = {
  entries: ContentEntry[];
  folders: FolderEntry[];
  files: FileEntry[];
  viewModel: ContentTreeViewModel;
  currentParent: FolderEntry;
};

export function ExplorerPage({ folderId }: { folderId: string }) {
  const contentTreeManager = ClientRegistry.getContentTreeManager();
  const [explorerState, setExplorerState] = useState<ExplorerState | null>(null);

  const [loading, setLoading] = useState(true);
  const [node, setNode] = useState<FolderContentNode | null>(null);

  // const [view, setView] = useState<'grid' | 'list'>('grid');

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectedEntries, setSelectedEntries] = useState<ContentEntry[]>([]);
  const [lastSelectedIndex, setLastSelectedIndex] = useState<number | null>(null);
  const [previewingFile, setPreviewingFile] = useState<FileEntry | null>(null);

  const [moveDialogOpen, setMoveDialogOpen] = useState(false);

  const addUpload = useUploadStore(s => s.addUpload);

  const explorerPrefs = usePreferencesStore(s => s.explorer);
  const setExplorerView = usePreferencesStore(s => s.setExplorerView);
  const setExplorerSortBy = usePreferencesStore(s => s.setExplorerSortBy);
  const setExplorerSortDir = usePreferencesStore(s => s.setExplorerSortDir);

  function toggleSelection(id: string) {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function clearSelection() {
    setSelectedIds(new Set());
  }

  const loadFolderState = useCallback(
    async (folderId: string) => {
      const result = await contentTreeManager.getOrFetch(folderId);
      setExplorerState(result);
    },
    [contentTreeManager]
  );

  const refresh = useCallback(
    (newEntry?: ContentEntry) => {
      setLoading(true);

      console.log('[Explorer] Refreshing folder state for:', folderId);

      if (newEntry) {
        contentTreeManager.addItem(newEntry, folderId);
      } else {
        console.log('[Explorer] Evicting folder data for:', folderId);
        contentTreeManager.store.evictFolderData(folderId);
      }

      loadFolderState(folderId).finally(() => setLoading(false));
    },
    [folderId, loadFolderState, contentTreeManager]
  );

  const handleTrash = async (id: string, isFolder: boolean) => {
    try {
      if (isFolder) {
        await trashFolderApi(id);
      } else {
        await trashFileApi(id);
      }
      toast.success(`${isFolder ? 'Folder' : 'File'} moved to trash.`);
      refresh();
    } catch (e) {
      console.error(e);
      toast.error(`Failed to move ${isFolder ? 'folder' : 'file'} to trash`);
    }
  };

  const getSelectedEntries = (): ContentEntry[] => {
    if (selectedIds.size === 0) return [];
    return explorerState?.entries.filter(i => selectedIds.has(i.id)) || [];
  };

  const isSelectionContainsFolders = () => {
    return getSelectedEntries().some(entry => entry.isFolder);
  };

  const handleBatchTrash = async () => {
    const selected = explorerState?.entries?.filter(i => selectedIds.has(i.id)) || [];

    const fileIds = selected.filter(i => !i.isFolder).map(i => i.id);
    const folderIds = selected.filter(i => i.isFolder).map(i => i.id);

    try {
      const [fileResult, folderResult] = await Promise.all([
        fileIds.length > 0 ? trashFilesApi(fileIds) : Promise.resolve({ failedIds: [] }),
        folderIds.length > 0 ? trashFoldersApi(folderIds) : Promise.resolve({ failedIds: [] }),
      ]);

      const failed = (fileResult.failedIds?.length ?? 0) + (folderResult.failedIds?.length ?? 0);

      if (failed) {
        toast.error(`Failed to trash ${failed} item(s)`);
      } else {
        toast.success(`${fileIds.length + folderIds.length} item(s) moved to Trash`);
      }

      clearSelection();
      refresh();
    } catch (err) {
      toast.error('Something went wrong');
    }
  };

  const handleMove = async (targetId: string | null) => {
    await ExplorerPageService.handleMove(selectedEntries, targetId, folderId);
    setMoveDialogOpen(false);
    refresh();
  };

  useEffect(() => {
    setLoading(true);
    loadFolderState(folderId).finally(() => setLoading(false));
  }, [folderId, loadFolderState]);

  useEffect(() => {
    const unsubscribe = contentTreeStore.subscribeToFolder(folderId, updatedNode => {
      setNode(null);
      setTimeout(() => {
        setNode(updatedNode);
      }, 10);
    });

    return () => unsubscribe();
  }, [folderId]);

  useEffect(() => {
    const folderKey = folderId ?? 'root';

    const unsub = useExplorerRefreshStore.subscribe(
      state => state.refreshFlags[folderKey],
      shouldRefresh => {
        if (shouldRefresh) {
          useExplorerRefreshStore.getState().getAndConsumeRefreshFlag(folderKey);
          refresh();
        }
      }
    );

    return () => unsub();
  }, [folderId, refresh]);

  const { entries: contentEntries } = explorerState ?? {};

  if (loading || !explorerState) {
    return <div className='p-4 text-muted-foreground'>Loading...</div>;
  }

  function handleItemClick(e: React.MouseEvent, id: string, index: number) {
    const isShift = e.shiftKey;
    const isMeta = e.metaKey || e.ctrlKey;

    if (isShift && lastSelectedIndex !== null) {
      const start = Math.min(lastSelectedIndex, index);
      const end = Math.max(lastSelectedIndex, index);
      const idsToSelect = contentEntries?.slice(start, end + 1).map(entry => entry.id);

      setSelectedIds(prev => {
        const next = new Set(prev);
        idsToSelect?.forEach(id => next.add(id));
        return next;
      });
    } else if (isMeta) {
      toggleSelection(id); // toggles on Ctrl/Cmd
      setLastSelectedIndex(index);
    } else {
      if (selectedIds.has(id)) {
        // Already selected → deselect
        setSelectedIds(prev => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
        setLastSelectedIndex(null);
      } else {
        // Select only this
        setSelectedIds(new Set([id]));
        setLastSelectedIndex(index);
      }
    }
  }

  // const handleFiles =  (files: File[], parentId: string) => {
  //   files.forEach((file) => {
  //     const reader = new BrowserFileReader(file);
  //     const metadata = reader.getMetadata();
  //
  //     const item = ClientRegistry.getUploadManager().enqueue(reader, folderId);
  //
  //     addUpload({
  //       id: item.id,
  //       fileName: metadata.name,
  //       parentFolderId : parentId,
  //       status: 'pending',
  //       progress: 0,
  //       uploadedBytes: 0,
  //       totalBytes: metadata.size,
  //     });
  //   });
  // }

  const handleDroppedFiles = async (files: Map<string, File[]>) => {
    await WebUploadService.uploadFilesInFolder(files, folderId);

    // Refresh current folder to show any newly created folders
    const folderKey = folderId ?? 'root';
    useExplorerRefreshStore.getState().triggerRefreshForFolder(folderKey);
    console.log(`🔄 Triggered refresh for folder after upload: ${folderKey}`);
  };

  const getEntryById = (id: string): FileEntry | FolderEntry | null => {
    return explorerState.entries?.find(entry => entry.id === id) || null;
  };

  const checkIfNameExists = (id: string, isFolder: boolean, newName: string): boolean => {
    const entries = isFolder ? explorerState.folders : explorerState.files;
    const exists = entries.some(entry => {
      if (entry.id === id) return false;
      return entry.name.toLowerCase().trim() === newName.toLowerCase().trim();
    });
    console.log(
      `Checking if name "${newName}" exists for ${isFolder ? 'folder' : 'file'}: ${exists}`
    );
    return exists;
  };

  const handleRename = async (id: string, isFolder: boolean, newName: string) => {
    try {
      const entry = getEntryById(id);
      if (!entry) {
        return {
          success: false,
          message: 'Entry not found',
        };
      }

      let updatedEntry: ContentEntry;
      if (isFolder) {
        updatedEntry = await renameFolder(entry as FolderEntry, newName);
      } else {
        updatedEntry = await renameFile(entry as FileEntry, newName);
      }
      console.log(`Renamed ${isFolder ? 'folder' : 'file'} ${id} to ${newName}`);

      //contentTreeManager.store.upsertItem(updatedEntry);
      refresh(updatedEntry);

      // const updatedNode = contentTreeStore.updateEntryForPage(updatedEntry, 'name', 'asc', 1);
      // if (updatedNode) {
      //   setNode(updatedNode);
      //   // Update breadcrumb if necessary
      //   const updatedBreadcrumb = breadcrumb.map((b) => {
      //     if (b.id === id) {
      //       return { ...b, name: newName };
      //     }
      //     return b;
      //   });
      //   setBreadcrumb(updatedBreadcrumb);
      // }

      toast.success('Renamed successfully');
    } catch (err) {
      console.error(err);
      toast.error('Rename failed');
    }
  };

  const handleBatchDownload = () => {
    console.log('Download selected:', selectedIds);
    const selectedFiles =
      (explorerState.entries?.filter(i => selectedIds.has(i.id) && !i.isFolder) as FileEntry[]) ||
      [];
    WebDownloadFilesService.enqueueFilesForDownload(selectedFiles);
    clearSelection();
  };

  return (
    <FileDropZone onDropFiles={handleDroppedFiles}>
      <div className='flex flex-col h-full'>
        <ExplorerBreadcrumb currentFolderId={folderId} />

        {/* 🛠️ Action Bar */}
        <div className='flex justify-between items-center px-4 py-2 border-b bg-background'>
          <div className='text-sm text-muted-foreground'>
            {selectedIds.size > 0
              ? `${selectedIds.size} selected`
              : `${contentEntries?.length ?? 0} items`}
          </div>

          <div className='flex gap-2'>
            {selectedIds.size > 0 ? (
              <>
                {/* Selection-specific actions */}
                <Button
                  variant='ghost'
                  size='icon'
                  onClick={handleBatchDownload}
                  title='Download selected'
                  disabled={isSelectionContainsFolders()}
                >
                  <Download className='w-5 h-5' />
                </Button>

                <Button
                  variant='ghost'
                  size='icon'
                  onClick={() => setMoveDialogOpen(true)}
                  title='Move selected'
                >
                  <ArrowRightLeft className='w-5 h-5' />
                </Button>
                <Button
                  variant='ghost'
                  size='icon'
                  onClick={handleBatchTrash}
                  title='Trash selected'
                >
                  <Trash className='w-5 h-5 text-red-500' />
                </Button>
                {/* Add download, move, etc. here */}
              </>
            ) : (
              <>
                {/* General controls */}
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
                        {explorerPrefs.sortBy === 'name'
                          ? 'Name'
                          : explorerPrefs.sortBy === 'size'
                            ? 'Size'
                            : 'Modified'}
                      </span>
                    </Button>
                  </DropdownMenuTrigger>

                  <DropdownMenuContent
                    align='end'
                    sideOffset={6}
                    className='z-50 w-44 rounded-md border bg-popover text-popover-foreground shadow-md'
                  >
                    <DropdownMenuItem onClick={() => setExplorerSortBy('name')}>
                      Name{' '}
                      {explorerPrefs.sortBy === 'name'
                        ? explorerPrefs.sortDir === 'asc'
                          ? '↑'
                          : '↓'
                        : ''}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setExplorerSortBy('size')}>
                      Size{' '}
                      {explorerPrefs.sortBy === 'size'
                        ? explorerPrefs.sortDir === 'asc'
                          ? '↑'
                          : '↓'
                        : ''}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setExplorerSortBy('updatedAt')}>
                      Modified{' '}
                      {explorerPrefs.sortBy === 'updatedAt'
                        ? explorerPrefs.sortDir === 'asc'
                          ? '↑'
                          : '↓'
                        : ''}
                    </DropdownMenuItem>

                    <DropdownMenuSeparator />

                    <DropdownMenuItem
                      onClick={() =>
                        setExplorerSortDir(explorerPrefs.sortDir === 'asc' ? 'desc' : 'asc')
                      }
                    >
                      Direction: {explorerPrefs.sortDir === 'asc' ? 'Asc' : 'Desc'}
                      {explorerPrefs.sortDir === 'asc' ? (
                        <ChevronUp className='w-4 h-4 ml-auto' />
                      ) : (
                        <ChevronDown className='w-4 h-4 ml-auto' />
                      )}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <Button variant='ghost' size='icon' onClick={() => refresh()} title='Refresh'>
                  <RefreshCw className='w-5 h-5' />
                </Button>
                <FileUploadButton
                  uploadManager={ClientRegistry.getUploadManager()}
                  parentFolderId={folderId}
                />
                <NewFolderDialog parentId={folderId} onSuccessAction={refresh} />
                <Button
                  variant='ghost'
                  size='icon'
                  onClick={() => setExplorerView(explorerPrefs.view === 'grid' ? 'list' : 'grid')}
                  title={
                    explorerPrefs.view === 'grid' ? 'Switch to list view' : 'Switch to grid view'
                  }
                >
                  <LayoutGrid className='w-5 h-5' />
                </Button>
              </>
            )}
          </div>
        </div>

        {/* 📂 Main content */}
        <main
          className='flex-1 overflow-y-auto bg-background'
          onClick={() => {
            clearSelection();
          }}
        >
          {contentEntries?.length === 0 ? (
            <EmptyFolder parentId={folderId} onSuccessAction={refresh} />
          ) : explorerPrefs.view === 'grid' ? (
            <div className='p-4 space-y-2'>
              <div className='grid [grid-template-columns:repeat(auto-fill,minmax(200px,1fr))] gap-4'>
                {contentEntries
                  ?.filter(f => f.isFolder)
                  .map((folder, index) => (
                    <ExplorerItem
                      key={folder.id}
                      entry={folder}
                      view='grid'
                      href={`/explorer/${folder.id}`}
                      selected={selectedIds.has(folder.id)}
                      multiSelect
                      onClick={e => handleItemClick(e, folder.id, index)}
                      onTrash={() => handleTrash(folder.id, true)}
                      checkIfNameExists={checkIfNameExists}
                      onRename={handleRename}
                      onMove={entry => {
                        selectedIds.add(entry.id);
                        setSelectedEntries(getSelectedEntries());
                        setMoveDialogOpen(true);
                      }}
                    />
                  ))}
                {contentEntries
                  ?.filter(f => !f.isFolder)
                  .map((file, index) => (
                    <ExplorerItem
                      key={file.id}
                      entry={file}
                      view='grid'
                      selected={selectedIds.has(file.id)}
                      onDoubleClick={() => {
                        if (!file.isFolder) setPreviewingFile(file);
                      }}
                      multiSelect
                      onClick={e =>
                        handleItemClick(e, file.id, explorerState?.folders.length + index)
                      }
                      onTrash={() => handleTrash(file.id, false)}
                      checkIfNameExists={checkIfNameExists}
                      onRename={handleRename}
                      onMove={entry => {
                        selectedIds.add(entry.id);
                        setSelectedEntries(getSelectedEntries());
                        setMoveDialogOpen(true);
                      }}
                    />
                  ))}
              </div>
            </div>
          ) : (
            <>
              {/* ✅ list view header row */}
              <div className='flex items-center h-9 px-4 text-sm text-muted-foreground font-medium border-b bg-muted/40'>
                <div className='w-5' />
                <div className='flex-1 pl-2'>Name</div>
                <div className='w-32 text-right'>Size</div>
                <div className='w-48 text-right'>Modified</div>
              </div>

              {/* ✅ list view items */}
              <div className='divide-y'>
                {contentEntries
                  ?.filter(f => f.isFolder)
                  .map((folder, index) => (
                    <ExplorerItem
                      key={folder.id}
                      entry={folder}
                      view='list'
                      href={`/explorer/${folder.id}`}
                      selected={selectedIds.has(folder.id)}
                      multiSelect
                      onClick={e => handleItemClick(e, folder.id, index)}
                      onTrash={() => handleTrash(folder.id, true)}
                      onContextOpen={() => {
                        selectedIds.add(folder.id);
                        setSelectedEntries(getSelectedEntries());
                      }}
                      onContextClose={() => {
                        selectedIds.delete(folder.id);
                        setSelectedEntries(getSelectedEntries());
                      }}
                      checkIfNameExists={checkIfNameExists}
                      onRename={handleRename}
                      onMove={entry => {
                        selectedIds.add(entry.id);
                        setSelectedEntries(getSelectedEntries());
                        setMoveDialogOpen(true);
                      }}
                    />
                  ))}
                {contentEntries
                  ?.filter(f => !f.isFolder)
                  .map((file, index) => (
                    <ExplorerItem
                      key={file.id}
                      entry={file}
                      view='list'
                      selected={selectedIds.has(file.id)}
                      multiSelect
                      onClick={e =>
                        handleItemClick(e, file.id, explorerState?.folders.length + index)
                      }
                      onTrash={() => handleTrash(file.id, false)}
                      checkIfNameExists={checkIfNameExists}
                      onRename={handleRename}
                      onMove={entry => {
                        selectedIds.add(entry.id);
                        setSelectedEntries(getSelectedEntries());
                        setMoveDialogOpen(true);
                      }}
                    />
                  ))}
              </div>
            </>
          )}
        </main>

        <FilePreviewModal file={previewingFile} onClose={() => setPreviewingFile(null)} />
      </div>

      <MoveDialog
        open={moveDialogOpen}
        folderId={folderId}
        entries={selectedEntries}
        onClose={() => setMoveDialogOpen(false)}
        handleMove={handleMove}
      />
    </FileDropZone>
  );
}
