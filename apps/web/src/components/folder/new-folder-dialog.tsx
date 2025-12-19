'use client';

import { useState } from 'react';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { FolderPlus } from 'lucide-react';
import { AlreadyExistsError, createNewFolder, decryptFolder, FolderEntry } from '@agam-space/client';
import { toast } from 'sonner';

type Props = {
  parentId: string;
  onSuccessAction: (folderEntry : FolderEntry) => void;
};

export function NewFolderDialog({ parentId, onSuccessAction }: Props) {
  const [name, setName] = useState('');
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async () => {
    if (!name.trim()) return;

    setLoading(true);
    try {
      const folder = await createNewFolder(name, parentId);
      const folderEntry = await decryptFolder(folder);
      setOpen(false);
      setName('');
      console.log('New folder created:', folderEntry);
      onSuccessAction?.(folderEntry);
      toast.success(`Folder ${name} created successfully`);
    } catch (e) {
      console.warn('Failed to create folder:', e);

      if (e instanceof AlreadyExistsError) {
        setError(e.message || 'Folder already exists.');
      } else {
        setError('Failed to create folder. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" title="New Folder">
          <FolderPlus className="w-5 h-5" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Folder</DialogTitle>
        </DialogHeader>
        <Input
          autoFocus
          placeholder="Folder name"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setError(null);
          }}
          onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
        />
        {error && (
          <div className="text-sm text-red-500 pb-2">{error}</div>
        )}
        <DialogFooter>
          <Button disabled={loading || !name.trim()} onClick={handleCreate}>
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
