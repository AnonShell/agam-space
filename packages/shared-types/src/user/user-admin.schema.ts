import { z } from 'zod';
import { UserSchema } from './user.schema';
import { bigintSchema } from '../common.schema';

export const UserWithQuotaSchema = UserSchema.extend({
  quota: z
    .object({
      totalStorageQuota: bigintSchema,
      usedStorage: bigintSchema,
    })
    .nullable(),
});

export const UsersWithQuotaArraySchema = z.array(UserWithQuotaSchema);

export type UserWithQuota = z.infer<typeof UserWithQuotaSchema>;
export type UsersWithQuotaArray = z.infer<typeof UsersWithQuotaArraySchema>;
