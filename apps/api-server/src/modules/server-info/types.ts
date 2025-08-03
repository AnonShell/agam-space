import { createZodDto } from 'nestjs-zod';
import { ServerConfigSchema } from '@agam-space/shared-types';

export class ServerConfigDto extends createZodDto(ServerConfigSchema) {}
