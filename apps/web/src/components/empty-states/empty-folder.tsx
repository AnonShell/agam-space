import { FolderOpen } from "lucide-react";
import { NewFolderDialog } from '@/components/folder/new-folder-dialog';
import { FileUploadButton } from '@/components/upload/file-upload-button';
import { ClientRegistry } from '@agam-space/client';

type Props = {
  parentId: string;
  onSuccessAction: () => void;
};

export function EmptyFolder({ parentId, onSuccessAction }: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center text-muted-foreground">
      <FolderOpen className="w-12 h-12 mb-4 text-muted" />
      <h2 className="text-lg font-semibold text-foreground">This folder is empty</h2>
      <p className="mb-4 text-sm">Start by uploading files or creating a new folder.</p>
      <div className="flex gap-2">
        <FileUploadButton
          uploadManager={ClientRegistry.getUploadManager()}
          parentFolderId={parentId}
        />
        <NewFolderDialog
          parentId={parentId}
          onSuccessAction={onSuccessAction}
        />
      </div>
    </div>
  );
}
