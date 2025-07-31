export interface FolderMetadata {
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateFolderRequest {
  parentId?: string;
  nameHash: string;
  metadataEncrypted: string;
  fkWrapped: string;
}

export interface FolderResponse {
  id: string;
  parentId?: string;
  nameHash: string;
  metadataEncrypted: string;
  fkWrapped: string;
  createdAt: string;
  updatedAt: string;
}
