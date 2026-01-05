import { z } from 'zod';
import { bigintSchema } from '../common.schema';

export const UpdateUserQuotaRequestSchema = z.object({
  totalStorageQuota: bigintSchema,
});

export type UpdateUserQuotaRequest = z.infer<typeof UpdateUserQuotaRequestSchema>;
