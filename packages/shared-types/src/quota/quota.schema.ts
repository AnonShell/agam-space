import { z } from 'zod';
import { bigintSchema, datetimeSchema, UlidSchema } from '../common.schema';

export const UserQuotaSchema = z.object({
  userId: UlidSchema,
  totalStorageQuota: bigintSchema.default(0),
  usedStorage: bigintSchema,
  refreshedAt: datetimeSchema,
  createdAt: datetimeSchema,
  updatedAt: datetimeSchema,
});

export type UserQuota = z.infer<typeof UserQuotaSchema>;
