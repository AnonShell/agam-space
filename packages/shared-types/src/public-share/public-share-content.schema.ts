import { z } from 'zod';
import { FileSchema } from '../folder/file.schema';
import { FolderSchema } from '../folder/folder.schema';

export const PublicSharedFolderSchema = FolderSchema.pick({
  id: true,
  parentId: true,
  fkWrapped: true,
  metadataEncrypted: true,
  size: true,
  createdAt: true,
  updatedAt: true,
});

export const PublicSharedFileSchema = FileSchema.pick({
  id: true,
  parentId: true,
  fkWrapped: true,
  metadataEncrypted: true,
  approxSize: true,
  createdAt: true,
  updatedAt: true,
  chunkCount: true,
});

export const PublicShareContentResponseSchema = z.object({
  itemType: z.enum(['folder', 'file']),
  file: PublicSharedFileSchema.optional(),
  folder: PublicSharedFolderSchema.optional(), // The shared folder itself (for getting name)
  contents: z
    .object({
      folders: z.array(PublicSharedFolderSchema),
      files: z.array(PublicSharedFileSchema),
    })
    .optional(),
});

export const PublicShareFolderContentsSchema = z.object({
  folders: z.array(PublicSharedFolderSchema),
  files: z.array(PublicSharedFileSchema),
});

export type PublicSharedFolder = z.infer<typeof PublicSharedFolderSchema>;
export type PublicSharedFile = z.infer<typeof PublicSharedFileSchema>;
export type PublicShareContentResponse = z.infer<typeof PublicShareContentResponseSchema>;
export type PublicShareFolderContents = z.infer<typeof PublicShareFolderContentsSchema>;
