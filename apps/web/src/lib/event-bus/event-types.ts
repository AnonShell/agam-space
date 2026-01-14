export interface ContentRestoredPayload {
  parentId: string | null;
  itemId: string;
  itemType: 'file' | 'folder';
}

export interface FilesTrashedPayload {
  parentId: string | null;
  itemIds: string[];
}

export interface FolderDeletedPayload {
  folderId: string;
}

export interface QuotaChangedPayload {
  used: number;
  limit: number;
}
