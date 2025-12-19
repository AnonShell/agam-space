const IGNORED_FILES = ['.DS_Store', 'Thumbs.db'];

export async function readAllFileSystemEntries(dataTransfer: DataTransfer): Promise<File[]> {
  const allFiles: File[] = [];

  const items = Array.from(dataTransfer.items);
  const supportsEntry = items.some(
    item => item.kind === 'file' && typeof item.webkitGetAsEntry === 'function'
  );

  if (!supportsEntry) {
    return Array.from(dataTransfer.files).filter(file => !IGNORED_FILES.includes(file.name));
  }

  const entries = items
    .filter(item => item.kind === 'file')
    .map(item => item.webkitGetAsEntry?.())
    .filter((e): e is FileSystemEntry => !!e);

  for (const entry of entries) {
    const files = await walkFileSystemEntry(entry);
    allFiles.push(...files.filter(file => !IGNORED_FILES.includes(file.name)));
  }

  return allFiles;
}

async function walkFileSystemEntry(entry: FileSystemEntry, path = ''): Promise<File[]> {
  return new Promise(resolve => {
    if (entry.isFile) {
      (entry as FileSystemFileEntry).file(file => {
        const relativePath = path ? `${path}/${file.name}` : file.name;
        Object.defineProperty(file, 'webkitRelativePath', {
          value: relativePath,
          configurable: true,
        });
        resolve([file]);
      });
    } else if (entry.isDirectory) {
      const reader = (entry as FileSystemDirectoryEntry).createReader();
      const entries: FileSystemEntry[] = [];

      const readAll = () => {
        reader.readEntries(async batch => {
          if (batch.length === 0) {
            const nested = await Promise.all(
              entries.map(e => walkFileSystemEntry(e, path ? `${path}/${entry.name}` : entry.name))
            );
            resolve(nested.flat());
          } else {
            entries.push(...batch);
            readAll();
          }
        });
      };

      readAll();
    }
  });
}

export function extractFlatFiles(dataTransfer: DataTransfer): File[] {
  const files: File[] = [];

  for (const item of Array.from(dataTransfer.items)) {
    if (item.kind === 'file') {
      const file = item.getAsFile();
      if (file) {
        Object.defineProperty(file, 'webkitRelativePath', {
          value: file.name,
          configurable: true,
        });
        files.push(file);
      }
    }
  }

  console.log(
    '🧪 Flat files:',
    files.map(f => f.name)
  );
  return files;
}

export function groupFilesByFolder(files: File[]): Map<string, File[]> {
  const filesByFolder = new Map<string, File[]>();

  for (const file of files) {
    const relativePath = file.webkitRelativePath ?? '';
    const pathParts = relativePath.split('/');
    pathParts.pop(); // remove filename
    const folderPath = pathParts.join('/'); // '' for root

    if (!filesByFolder.has(folderPath)) {
      filesByFolder.set(folderPath, []);
    }

    filesByFolder.get(folderPath)!.push(file);
  }

  return filesByFolder;
}
