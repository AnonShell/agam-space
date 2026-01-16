import { FileEntry, FolderEntry } from '@agam-space/client';

type ContentEntry = FileEntry | FolderEntry;
type SortBy = 'name' | 'size' | 'modified';
type SortDir = 'asc' | 'desc';

export function sortTrashItems(
  folders: FolderEntry[],
  files: FileEntry[],
  sortBy: SortBy,
  sortDir: SortDir,
  groupFolders: boolean
): ContentEntry[] {
  const sortComparator = (a: ContentEntry, b: ContentEntry): number => {
    let comparison = 0;

    switch (sortBy) {
      case 'name':
        comparison = a.name.localeCompare(b.name, undefined, {
          numeric: true,
          sensitivity: 'base',
        });
        break;

      case 'size': {
        const sizeA = a.isFolder ? a.size || 0 : a.size;
        const sizeB = b.isFolder ? b.size || 0 : b.size;
        comparison = sizeA - sizeB;
        break;
      }

      case 'modified': {
        const dateA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
        const dateB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
        comparison = dateA - dateB;
        break;
      }
    }

    return sortDir === 'asc' ? comparison : -comparison;
  };

  const allItems: ContentEntry[] = [...folders, ...files];

  allItems.sort((a, b) => {
    if (groupFolders && a.isFolder !== b.isFolder) {
      return a.isFolder ? -1 : 1;
    }

    return sortComparator(a, b);
  });

  return allItems;
}
