'use client';

import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Folder } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { ContentEntry, FolderEntry, getFolderInfo, getFoldersInFolder } from '@agam-space/client';

export type nullish = null | undefined;
const isRoot = (id: string | nullish) => !id || id === 'root';
const hasParent = (id: string | nullish) => id && !isRoot(id);

interface MoveDialogProps {
  open: boolean;
  folderId?: string | null;
  entries: ContentEntry[];
  onClose: () => void;
  handleMove: (targetId: string | null) => void;
}

export function MoveDialog({
                             open,
                             folderId,
                             entries,
                             onClose,
                             handleMove,
                           }: MoveDialogProps) {
  const ROOT_ID = null;
  const selectedFolderIds = new Set(entries.filter((e) => e.isFolder).map((e) => e.id));

  const [currentFolderId, setCurrentFolderId] = useState<string | nullish>( folderId ?? ROOT_ID );
  const [subfolders, setSubfolders] = useState<FolderEntry[]>([]);
  const [selectedTargetId, setSelectedTargetId] = useState<string | null>(null);
  const [wasOpened, setWasOpened] = useState(false);


  const load = useCallback(async (folderId: string | null) => {
    const subs = await getFoldersInFolder(folderId);
    setSubfolders(subs);
  }, []);

  const goUp = async () => {
    if (isRoot(currentFolderId)) return;
    const parent = await getFolderInfo(currentFolderId!);
    const newId = hasParent(parent.parentId) ? parent.parentId ?? null : ROOT_ID;
    setCurrentFolderId(newId);
    setSelectedTargetId(null);
  };

  useEffect(() => {
    if (open) {
      if (!wasOpened) {
        setCurrentFolderId(folderId ?? ROOT_ID);
        setSelectedTargetId(null);
        setWasOpened(true);
      }
    } else {
      setWasOpened(false); // Reset on dialog close
    }
  }, [open, folderId, wasOpened]);

  useEffect(() => {
    if (open) {
      load(currentFolderId ?? null);
    }
  }, [currentFolderId, open, load]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Move selected items</DialogTitle>
        </DialogHeader>

        <div className="max-h-64 overflow-y-auto space-y-1">
          <div className="border-t border-border my-2" />
          <div className="bg-muted/30 rounded-md border max-h-64 overflow-y-auto space-y-1 p-2">
            {currentFolderId && (
              <button
                className="w-full text-left px-2 py-1 hover:bg-muted rounded"
                onClick={goUp}
              >
                <ArrowLeft className="inline w-4 h-4 mr-2" />
                ..
              </button>
            )}
          {subfolders
            .filter((folder) => !selectedFolderIds.has(folder.id))
            .map((folder) => (
            <div
              key={folder.id}
              className={`w-full text-left px-3 py-2 rounded-md cursor-pointer text-sm transition-colors ${
                selectedTargetId === folder.id
                  ? 'bg-muted font-medium'
                  : 'hover:bg-accent'
              }`}
              onClick={() => setSelectedTargetId(folder.id)}
              onDoubleClick={() => setCurrentFolderId(folder.id)}
            >
              <Folder className="inline w-4 h-4 mr-2" />
              {folder.name}
            </div>
          ))}
          </div>
        </div>

        <DialogFooter className="pt-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={() => handleMove(selectedTargetId)} disabled={!selectedTargetId || selectedTargetId === currentFolderId}>
            Move here
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}