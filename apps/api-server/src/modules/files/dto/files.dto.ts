import { createZodDto } from 'nestjs-zod';
import {
  CreateFileSchema,
  FileSchema,
  TrashFilesResponseSchema,
  UpdateFileSchema,
  RestoreFileSchema,
  BatchCheckExistsSchema,
} from '@agam-space/shared-types';

export class CreateFileDto extends createZodDto(CreateFileSchema) {}

export class UpdateFileDto extends createZodDto(UpdateFileSchema) {}

export class TrashFilesResponseDto extends createZodDto(TrashFilesResponseSchema) {}

export const CheckFileExistsQuery = FileSchema.pick({
  nameHash: true,
}).extend({
  parentId: FileSchema.shape.parentId.optional(),
});

export class CheckFileExistsDto extends createZodDto(CheckFileExistsQuery) {}

export class BatchCheckExistsDto extends createZodDto(BatchCheckExistsSchema) {}

export class RestoreFileDto extends createZodDto(RestoreFileSchema) {}
