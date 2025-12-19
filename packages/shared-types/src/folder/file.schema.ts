import { z } from 'zod';
import { BASE64_REGEX, bigintSchema, datetimeSchema, UlidSchema } from '../common.schema';

export const FileSchema = z.object({
  id: UlidSchema,
  userId: UlidSchema,
  parentId: UlidSchema.nullish(),
  nameHash: z.string().min(1).max(100),
  fkWrapped: z.string().min(64).max(500).regex(BASE64_REGEX, 'Invalid base64 encoded wrapped key'),
  metadataEncrypted: z
    .string()
    .min(1)
    .max(1000)
    .regex(BASE64_REGEX, 'Invalid base64 encoded metadata'),
  chunkCount: z.number().int().nonnegative(),
  approxSize: bigintSchema,
  createdAt: datetimeSchema,
  updatedAt: datetimeSchema,
});

export const CreateFileSchema = z.object({
  nameHash: FileSchema.shape.nameHash,
  fkWrapped: FileSchema.shape.fkWrapped,
  parentId: FileSchema.shape.parentId,
  metadataEncrypted: FileSchema.shape.metadataEncrypted,
  chunkCount: FileSchema.shape.chunkCount,
});

export const UpdateFileSchema = z.object({
  nameHash: CreateFileSchema.shape.nameHash.optional(),
  fkWrapped: CreateFileSchema.shape.fkWrapped.optional(),
  parentId: CreateFileSchema.shape.parentId.optional(),
  metadataEncrypted: CreateFileSchema.shape.metadataEncrypted.optional(),
});

export const RawFileMetadataSchema = z.object({
  name: z.string().min(1).max(100),
  size: z.number().int().nonnegative(),
  mimeType: z.string().nullish(),
  createdAt: datetimeSchema.nullish(),
  modifiedAt: datetimeSchema.nullish(),
});

export const UserFileMetadataSchema = RawFileMetadataSchema.extend({
  customTags: z.array(z.string()).nullish(),
  extra: z.record(z.any()).nullish(),
});

export const TrashFilesResponseSchema = z.object({
  failedIds: z.array(UlidSchema).nullish(),
});

export type RawFileMetadata = z.infer<typeof RawFileMetadataSchema>;
export type UserFileMetadata = z.infer<typeof UserFileMetadataSchema>;

export type File = z.infer<typeof FileSchema>;

export const FileArraySchema = z.array(FileSchema);
export type FileArray = z.infer<typeof FileArraySchema>;
export type CreateFile = z.infer<typeof CreateFileSchema>;
export type UpdateFile = z.infer<typeof UpdateFileSchema>;
export type TrashFilesResponse = z.infer<typeof TrashFilesResponseSchema>;
