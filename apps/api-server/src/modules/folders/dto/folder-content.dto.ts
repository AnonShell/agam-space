import { createZodDto } from 'nestjs-zod';
import {
  CreatedFolderSchema,
  FileSchema,
  FolderContentsSchema,
  FolderSchema,
  UpdateFolderSchema,
} from '@agam-space/shared-types';

export class CreateFolderDto extends createZodDto(CreatedFolderSchema) {}

export class UpdateFolderDto extends createZodDto(UpdateFolderSchema) {}

export class FileDto extends createZodDto(FileSchema) {}

export class FolderDto extends createZodDto(FolderSchema) {}

export class FolderContentsDto extends createZodDto(FolderContentsSchema) {}

export function isRootFolder(folderId: string): boolean {
  return !folderId || folderId === 'root';
}

export function isValidFolderAndNotRoot(folderId: string): boolean {
  return folderId && !isRootFolder(folderId);
}
