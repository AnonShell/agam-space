import { LRUCache } from 'lru-cache';
import { getFolderInfo } from './folder/folder-contents';
import { FolderMetadata, UserFileMetadata } from '@agam-space/shared-types';
import { SortDirection } from './folder/content-tree/content-tree-v2.store';

export type FolderEntry = {
  id: string;
  name: string;
  nameHash?: string;
  parentId?: string;
  isFolder: true;
  size?: number;
  count?: number;
  createdAt?: Date;
  updatedAt?: Date;
  metadata?: FolderMetadata;
};

export type FileEntry = {
  id: string;
  name: string;
  size: number;
  mime: string;
  parentId: string;
  isFolder: false;
  chunkCount: number;
  createdAt?: Date;
  updatedAt?: Date;
  metadata?: UserFileMetadata;
};

export type ContentEntry = FileEntry | FolderEntry;

export type SortOrder = 'name' | 'date-created' | 'date-modified' | 'size';
// export type SortDirection = 'asc' | 'desc';

export type TreeNode = {
  id: string; // folder ID
  name: string;
  parentId?: string;
  folders: FolderEntry[];
  files: FileEntry[];
  page: number;
  hasMore: boolean;
  sortBy: SortOrder;
};

export type FolderContentNode = {
  folders: FolderEntry[];
  files: FileEntry[];
  page: number;
  hasMore: boolean;
  sortBy: SortOrder;
};

export type ContentTreeEntry = {
  folder: FolderEntry;
  node: FolderContentNode;
};

function makeKey(folderId: string, sortBy: SortOrder, direction: SortDirection, page: number) {
  return `${folderId}|sort=${sortBy}:${direction}|page=${page}`;
}

type FolderCallback = (node: FolderContentNode) => void;

class ContentTreeStore {
  private folderMetadata = new LRUCache<string, FolderEntry>({
    max: 100,
    ttl: 10 * 60 * 1000,
  });

  private nodes = new LRUCache<string, FolderContentNode>({
    max: 100,
    ttl: 10 * 60 * 1000,
  });

  private subscribers = new Map<string, Set<FolderCallback>>();

  subscribeToFolder(folderId: string, cb: FolderCallback) {
    if (!this.subscribers.has(folderId)) {
      this.subscribers.set(folderId, new Set());
    }
    this.subscribers.get(folderId)!.add(cb);

    return () => {
      this.subscribers.get(folderId)!.delete(cb);
    };
  }

  notifySubscribers(folderId: string, node: FolderContentNode) {
    this.subscribers.get(folderId)?.forEach(cb => cb(node));
  }

  async getOrFetch(
    folderId: string,
    page: number,
    sortBy: SortOrder = 'name',
    sortDirection: SortDirection = 'asc',
    fetchFn: () => Promise<{ folders: FolderEntry[]; files: FileEntry[]; hasMore: boolean }>,
    fetchFolderInfo: (folderId: string) => Promise<FolderEntry>
  ): Promise<ContentTreeEntry> {
    let folder = this.folderMetadata.get(folderId);
    if (!folder) {
      if (folderId === 'root') {
        folder = {
          id: 'root',
          name: 'root',
          isFolder: true,
        };
      } else {
        folder = await fetchFolderInfo(folderId);
      }
    }

    const key = makeKey(folderId, sortBy, sortDirection, page);
    const cached = this.nodes.get(key);
    if (cached) {
      return {
        node: cached,
        folder,
      };
    }

    const { folders, files, hasMore } = await fetchFn();

    folders.sort(compareFn(sortBy, sortDirection));
    files.sort(compareFn(sortBy, sortDirection));

    const node: FolderContentNode = {
      folders,
      files,
      page,
      hasMore,
      sortBy,
    };

    this.nodes.set(key, node);
    folders.forEach(folder => this.folderMetadata.set(folder.id, folder));

    this.notifySubscribers(folderId, node);

    return {
      node,
      folder,
    };
  }

  hasFolder(folderId: string): boolean {
    return this.folderMetadata.has(folderId);
  }

  setFolder(folderId: string, folder: FolderEntry) {
    this.folderMetadata.set(folderId, folder);
  }

  async getFolderMetadata(
    folderId: string,
    fetchFolderInfo?: (folderId: string) => Promise<FolderEntry>
  ): Promise<FolderEntry | undefined> {
    if (!folderId || folderId === 'root') {
      return undefined;
    }

    let folder = this.folderMetadata.get(folderId);
    if (!folder && fetchFolderInfo) {
      folder = await fetchFolderInfo(folderId);
      this.folderMetadata.set(folderId, folder);
    }
    return folder;
  }

  has(folderId: string, sortBy: SortOrder, sortDirection: SortDirection, page: number): boolean {
    return this.nodes.has(makeKey(folderId, sortBy, sortDirection, page));
  }

  getNode(
    folderId: string,
    sortBy: SortOrder,
    sortDirection: SortDirection,
    page: number
  ): FolderContentNode | undefined {
    return this.nodes.get(makeKey(folderId, sortBy, sortDirection, page));
  }

  getPath(folderId: string): FolderEntry[] {
    const path: FolderEntry[] = [];
    const visited = new Set<string>();

    let current = this.folderMetadata.get(folderId);

    if (current && current.id === 'root') {
      return [];
    }

    while (current && !visited.has(current.id)) {
      visited.add(current.id);
      path.unshift(current);

      if (!current.parentId || current.parentId === 'root') break;

      current = this.folderMetadata.get(current.parentId);
    }

    return path;
  }

  forceRefresh(folderId: string, sortBy: SortOrder, sortDirection: SortDirection, page: number) {
    this.nodes.delete(makeKey(folderId, sortBy, sortDirection, page));
  }

  invalidate(folderId: string) {
    // Invalidate all pages for the given folderId
    const keysToDelete = Array.from(this.nodes.keys()).filter(key =>
      key.startsWith(folderId + '|')
    );
    for (const key of keysToDelete) {
      this.nodes.delete(key);
    }
  }

  clear() {
    this.nodes.clear();
  }

  updateEntry(updatedEntry: ContentEntry) {
    return this.updateEntryForPage(
      updatedEntry,
      'name',
      'asc', // Default sort direction
      1 // Default page
    );
  }

  updateEntryForPage(
    updatedEntry: ContentEntry,
    sortBy: SortOrder,
    sortDirection: SortDirection,
    page: number
  ) {
    const parentId = updatedEntry.parentId || 'root';
    const key = makeKey(parentId, sortBy, sortDirection, page);
    const node = this.getNode(parentId, sortBy, sortDirection, page);
    if (!node) return undefined;

    let newFolders = node.folders;
    let newFiles = node.files;

    if (updatedEntry.isFolder) {
      const folderIndex = node.folders.findIndex(f => f.id === updatedEntry.id);
      if (folderIndex !== -1) {
        newFolders = [
          ...node.folders.slice(0, folderIndex),
          updatedEntry as FolderEntry,
          ...node.folders.slice(folderIndex + 1),
        ];
      } else {
        newFolders = [...node.folders, updatedEntry as FolderEntry];
      }
      newFolders = newFolders.sort(compareFn(sortBy, sortDirection));
    } else {
      const fileIndex = node.files.findIndex(f => f.id === updatedEntry.id);
      if (fileIndex !== -1) {
        newFiles = [
          ...node.files.slice(0, fileIndex),
          updatedEntry as FileEntry,
          ...node.files.slice(fileIndex + 1),
        ];
      } else {
        newFiles = [...node.files, updatedEntry as FileEntry];
      }
      newFiles = newFiles.sort(compareFn(sortBy, sortDirection));
    }

    const newNode = {
      ...node,
      folders: newFolders,
      files: newFiles,
    };

    this.nodes.set(key, newNode);
    this.notifySubscribers(parentId, newNode);

    console.log(`Updated entry for ${updatedEntry.id} in folder ${parentId}`);

    return newNode;

    // if (node) {
    //   if (updatedEntry.isFolder) {
    //     const folderIndex = node.folders.findIndex(f => f.id === updatedEntry.id);
    //     if (folderIndex !== -1) {
    //       node.folders[folderIndex] = updatedEntry as FolderEntry;
    //     } else {
    //       node.folders.push(updatedEntry as FolderEntry);
    //     }
    //   } else {
    //     const fileIndex = node.files.findIndex(f => f.id === updatedEntry.id);
    //     if (fileIndex !== -1) {
    //       node.files[fileIndex] = updatedEntry as FileEntry;
    //     } else {
    //       node.files.push(updatedEntry as FileEntry);
    //     }
    //   }
    //   const newNode = {
    //     ...node,
    //     folders: [...node.folders].sort(compareFn(sortBy, sortDirection)),
    //     files: [...node.files].sort(compareFn(sortBy, sortDirection)),
    //   }
    //   this.nodes.set(makeKey(parentId, sortBy, sortDirection, page), newNode);
    //   console.log(`Updated entry for ${updatedEntry.id} in folder ${parentId}`);
    //   this.notifySubscribers(parentId, newNode);
    // }
    // return node;
  }
}

function compareFn(
  sortBy: SortOrder,
  direction: SortDirection = 'asc'
): (a: ContentEntry, b: ContentEntry) => number {
  const dir = direction === 'asc' ? 1 : -1;

  switch (sortBy) {
    case 'name':
      return (a, b) => a.name.localeCompare(b.name) * dir;

    case 'size':
      return (a, b) => {
        const aSize = a.isFolder ? 0 : a.size;
        const bSize = b.isFolder ? 0 : b.size;
        return (aSize - bSize) * dir;
      };

    case 'date-modified':
      return (a, b) => {
        const aDate = (a as any).modifiedAt ?? 0;
        const bDate = (b as any).modifiedAt ?? 0;
        return (new Date(aDate).getTime() - new Date(bDate).getTime()) * dir;
      };

    case 'date-created':
      return (a, b) => {
        const aDate = (a as any).modifiedAt ?? 0;
        const bDate = (b as any).modifiedAt ?? 0;
        return (new Date(aDate).getTime() - new Date(bDate).getTime()) * dir;
      };

    default:
      return () => 0;
  }
}

export const contentTreeStore = new ContentTreeStore();
