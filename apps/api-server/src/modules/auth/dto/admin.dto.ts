import { createZodDto } from 'nestjs-zod';
import { UpdateUserStatusRequestSchema } from '@agam-space/shared-types';

export class UpdateUserStatusDto extends createZodDto(UpdateUserStatusRequestSchema) {}
