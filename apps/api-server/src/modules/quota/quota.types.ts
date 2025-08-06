import { createZodDto } from 'nestjs-zod';
import { UserQuotaSchema } from '@agam-space/shared-types';


export class UserQuotaDto extends createZodDto(UserQuotaSchema){}