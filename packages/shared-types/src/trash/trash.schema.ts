import { z } from 'zod';
import { FolderSchema } from '../folder/folder.schema';
import { FileSchema } from '../folder/file.schema';

export const EmptyTrashResponseSchema = z.object({
  deletedCount: z.number().int().nonnegative(),
});

export type EmptyTrashResponse = z.infer<typeof EmptyTrashResponseSchema>;

export const TrashItemsSchema = z.object({
  folders: z.array(FolderSchema),
  files: z.array(FileSchema),
});

export type TrashedItems = z.infer<typeof TrashItemsSchema>;
