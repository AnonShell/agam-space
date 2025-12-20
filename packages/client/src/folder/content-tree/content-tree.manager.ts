import {
  ContentTreeV2Store,
  ContentTreeViewModel,
  Sort,
  SortDirection,
  SortKey,
} from './content-tree-v2.store';
import { decryptFolder, fetchFolderContents, getFolderInfo } from '../folder-contents';
import { isFolderIdRoot } from '@agam-space/shared-types';
import { ContentEntry, contentTreeStore, FileEntry, FolderEntry } from '../../content-tree.store';
import { fetchFolderAncestorsApi } from '../../api';

type ExplorerState = {
  entries: ContentEntry[];
  folders: FolderEntry[];
  files: FileEntry[];
  viewModel: ContentTreeViewModel;
  currentParent: FolderEntry;
};

export class ContentTreeManager {
  public readonly store: ContentTreeV2Store;

  constructor() {
    this.store = new ContentTreeV2Store();
  }

  async getOrFetch(
    folderId: string,
    sort: Sort = {
      key: 'name',
      direction: 'asc',
    },
    page = 0
  ): Promise<ExplorerState | null> {
    const sortKey = `${sort.key}:${sort.direction}:${page}`;
    const folderInfo = await this.getFolderInfo(folderId);

    let viewModel = this.store.getView(folderId, sortKey);
    if (viewModel) {
      return this.buildExplorerState(viewModel, folderInfo, sortKey, page);
    }

    const { folders, files } = await fetchFolderContents(folderId);
    for (const item of [...folders, ...files]) {
      this.store.upsertItem(item);
    }

    const sorted = [...folders, ...files].sort(
      ContentTreeV2Store.applySort(sort.key, sort.direction)
    );
    const pageItems = [...new Set(sorted.map(item => item.id))];

    viewModel = {
      pages: new Map([[0, pageItems]]),
      isLoading: false,
      hasMore: false, // Assuming no pagination for simplicity
      lastFetchedAt: Date.now(),
    };

    this.store.setView(folderId, sortKey, viewModel);
    return this.buildExplorerState(viewModel, folderInfo, sortKey, page);
  }

  buildExplorerState(
    viewModel: ContentTreeViewModel,
    currentParent: FolderEntry,
    sortKey: string,
    pageNo: number = 0
  ): ExplorerState | null {
    if (!viewModel || !viewModel.pages.has(pageNo)) {
      return null;
    }

    const pageItems = [...new Set(viewModel.pages.get(pageNo) || [])];
    const entries = this.getItems(pageItems);

    const [key, direction] = sortKey.split(':') as [SortKey, SortDirection];

    const folders = entries.filter(f => f.isFolder) as FolderEntry[];
    folders.sort(ContentTreeV2Store.applySort(key, direction));

    const files = entries.filter(f => !f.isFolder) as FileEntry[];
    files.sort(ContentTreeV2Store.applySort(key, direction));

    const sortedEntries = [...folders, ...files];

    return {
      entries: sortedEntries,
      folders,
      files,
      viewModel,
      currentParent,
    };
  }

  getItems(ids: string[]): ContentEntry[] {
    return this.store.getAllItems(ids);
  }

  addItem(
    item: ContentEntry,
    currentParentId: string,
    sort: Sort = {
      key: 'name',
      direction: 'asc',
    },
    page = 0
  ) {
    this.store.upsertItem(item);

    const sortKey = `${sort.key}:${sort.direction}:${page}`;
    const viewModel = this.store.getView(currentParentId, sortKey);
    if (viewModel && viewModel.pages.has(page)) {
      const pageItems = viewModel.pages.get(page)! || [];
      pageItems.unshift(item.id);
      viewModel.pages.set(page, [...new Set(pageItems)]);

      this.store.setView(currentParentId, sortKey, viewModel);
    }
  }

  private async getFolderInfo(folderId: string) {
    let folderInfo = this.store.getItem(folderId);
    if (folderInfo) {
      return folderInfo as FolderEntry;
    }

    if (isFolderIdRoot(folderId)) {
      folderInfo = {
        id: 'root',
        name: 'Root Folder',
        isFolder: true,
      };
    } else {
      folderInfo = await getFolderInfo(folderId);
      if (!folderInfo) {
        throw new Error(`Folder with ID ${folderId} not found`);
      }
    }
    this.store.upsertItem(folderInfo);
    return folderInfo as FolderEntry;
  }

  async loadAncestorsPath(folderId: string, depth: number): Promise<FolderEntry[]> {
    const folder = await this.getFolderInfo(folderId);
    console.log(
      `[ContentTreeManager] Loading ancestors for folder ${folder.name} (depth: ${depth})`
    );

    if (isFolderIdRoot(folderId)) {
      return [];
    }

    if (folder.parentId && !this.store.getItem(folder.parentId)) {
      const ancestors = await fetchFolderAncestorsApi(folder.id, depth);

      for (const ancestor of ancestors) {
        const folderEntry = await decryptFolder(ancestor);
        this.store.upsertItem(folderEntry);
      }
    }

    return this.store.getAncestorPath(folderId);
  }
}
