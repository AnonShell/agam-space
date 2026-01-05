import { createZodDto } from 'nestjs-zod';
import { UpdateUserQuotaRequestSchema } from '@agam-space/shared-types';

export class UpdateUserQuotaDto extends createZodDto(UpdateUserQuotaRequestSchema) {}
