import { z } from 'zod';

import { BASE64_REGEX, bigintSchema, datetimeSchema, UlidSchema } from '../common.schema';
import { FileArraySchema } from './file.schema';

export const FolderSchema = z.object({
  id: UlidSchema,
  parentId: z.string().min(1).max(50).nullish(),
  nameHash: z.string().min(1).max(100),
  size: bigintSchema.optional(),
  metadataEncrypted: z
    .string()
    .min(1)
    .max(500)
    .regex(BASE64_REGEX, 'Invalid base64 encoded metadata'),
  fkWrapped: z.string().min(64).max(500).regex(BASE64_REGEX, 'Invalid base64 encoded wrapped key'),
  createdAt: datetimeSchema,
  updatedAt: datetimeSchema,
  status: z.enum(['active', 'trashed', 'deleted']).default('active'),
});

export const CreatedFolderSchema = FolderSchema.pick({
  parentId: true,
  nameHash: true,
  metadataEncrypted: true,
  fkWrapped: true,
});

export const UpdateFolderSchema = z.object({
  parentId: CreatedFolderSchema.shape.parentId.optional(),
  nameHash: CreatedFolderSchema.shape.nameHash.optional(),
  metadataEncrypted: CreatedFolderSchema.shape.metadataEncrypted.optional(),
  fkWrapped: CreatedFolderSchema.shape.fkWrapped.optional(),
});

export type Folder = z.infer<typeof FolderSchema>;
export type CreatedFolder = z.infer<typeof CreatedFolderSchema>;
export type UpdateFolder = z.infer<typeof UpdateFolderSchema>;

export const FolderArraySchema = z.array(FolderSchema);
export type FolderArray = z.infer<typeof FolderArraySchema>;

export const FolderContentsSchema = z.object({
  folders: FolderArraySchema,
  files: FileArraySchema,
});

export const FolderContentsPaginatedSchema = FolderContentsSchema.extend({
  hasMore: z.boolean().default(false),
});

export type FolderContents = z.infer<typeof FolderContentsSchema>;
export type FolderContentsPaginated = z.infer<typeof FolderContentsPaginatedSchema>;

export const TrashFoldersResponseSchema = z.object({
  failedIds: z.array(UlidSchema).nullish(),
});

export const BatchCheckFolderExistsItemSchema = z.object({
  parentId: z.string().nullable(),
  nameHash: z.string(),
});

export const BatchCheckFolderExistsSchema = z.object({
  checks: z.array(BatchCheckFolderExistsItemSchema),
});

export const BatchCheckFolderExistsResultSchema = z.object({
  nameHash: z.string(),
  exists: z.boolean(),
});

export const BatchCheckFolderExistsResponseSchema = z.object({
  results: z.array(BatchCheckFolderExistsResultSchema),
});

export const RestoreFolderSchema = z
  .object({
    nameHash: z.string().optional(),
    metadataEncrypted: z.string().optional(),
  })
  .optional();

export type TrashFoldersResponse = z.infer<typeof TrashFoldersResponseSchema>;
export type RestoreFolder = z.infer<typeof RestoreFolderSchema>;
export type BatchCheckFolderExistsItem = z.infer<typeof BatchCheckFolderExistsItemSchema>;
export type BatchCheckFolderExists = z.infer<typeof BatchCheckFolderExistsSchema>;
export type BatchCheckFolderExistsResult = z.infer<typeof BatchCheckFolderExistsResultSchema>;
export type BatchCheckFolderExistsResponse = z.infer<typeof BatchCheckFolderExistsResponseSchema>;

export const isFolderIdRoot = (id: string | null | undefined): boolean => {
  return !id || id.toLowerCase().trim() === 'root';
};
