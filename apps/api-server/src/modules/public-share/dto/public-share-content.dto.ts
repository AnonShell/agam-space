import { createZodDto } from 'nestjs-zod';
import {
  PublicShareContentResponseSchema,
  PublicShareFolderContentsSchema,
  PublicSharedFileSchema,
  PublicSharedFolderSchema,
} from '@agam-space/shared-types';

export class PublicSharedFileDto extends createZodDto(PublicSharedFileSchema) {}

export class PublicSharedFolderDto extends createZodDto(PublicSharedFolderSchema) {}

export class PublicShareContentResponseDto extends createZodDto(PublicShareContentResponseSchema) {}

export class PublicShareFolderContentsDto extends createZodDto(PublicShareFolderContentsSchema) {}
