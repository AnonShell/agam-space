import { createZodDto } from 'nestjs-zod';
import {
  CreatedFolderSchema,
  FileSchema,
  FolderContentsSchema,
  FolderSchema,
  UpdateFolderSchema,
  RestoreFolderSchema,
  BatchCheckFolderExistsSchema,
} from '@agam-space/shared-types';

export class CreateFolderDto extends createZodDto(CreatedFolderSchema) {}

export class UpdateFolderDto extends createZodDto(UpdateFolderSchema) {}

export class FileDto extends createZodDto(FileSchema) {}

export class FolderDto extends createZodDto(FolderSchema) {}

export class FolderContentsDto extends createZodDto(FolderContentsSchema) {}

export class BatchCheckFolderExistsDto extends createZodDto(BatchCheckFolderExistsSchema) {}

export class RestoreFolderDto extends createZodDto(RestoreFolderSchema) {}

export function isRootFolder(folderId: string): boolean {
  return !folderId || folderId === 'root';
}

export function isValidFolderAndNotRoot(folderId: string): boolean {
  return folderId && !isRootFolder(folderId);
}
