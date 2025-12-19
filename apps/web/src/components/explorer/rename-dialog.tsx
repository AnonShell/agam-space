'use client';

import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';

export function RenameDialog({
                               open,
                               entryId,
                               isFolder,
                               currentName,
                               onClose,
                               onRename,
                               checkNameExists,
                             }: {
  open: boolean;
  entryId: string;
  isFolder: boolean;
  currentName: string;
  onClose: () => void;
  onRename: (id: string, isFolder: boolean, newName: string) => void;
  checkNameExists: (id: string, isFolder: boolean, newName: string) => boolean;
}) {
  const [newName, setNewName] = useState(currentName);
  const [error, setError] = useState('');

  useEffect(() => {
    setNewName(currentName);
    setError('');
  }, [open, currentName]);

  const handleSubmit = () => {
    console.log('handleSubmit called with newName:', newName);
    const trimmed = newName.trim();
    if (!trimmed) return setError('Name cannot be empty');
    if (trimmed === currentName) return onClose();
    console.log(`checking if name exists for entryId: ${entryId}, isFolder: ${isFolder}, name: ${trimmed}`, checkNameExists(entryId, isFolder, trimmed));
    if (checkNameExists(entryId, isFolder, trimmed)) return setError('Name already exists');
    onRename(entryId, isFolder, trimmed);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Rename</DialogTitle>
        </DialogHeader>
        <Input
          value={newName}
          onChange={(e) => {
            setNewName(e.target.value);
            setError('');
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSubmit();
          }}
          autoFocus
        />
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <DialogFooter className="pt-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit}>Rename</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
