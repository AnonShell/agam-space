import { createZodDto } from 'nestjs-zod';
import { EmptyTrashResponseSchema, TrashItemsSchema } from '@agam-space/shared-types';

export class EmptyTrashResponseDto extends createZodDto(EmptyTrashResponseSchema) {}

export class TrashedItemsDto extends createZodDto(TrashItemsSchema) {}
