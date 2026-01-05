import { z } from 'zod';
import { UserStatusSchema } from './user.schema';

export const UpdateUserStatusRequestSchema = z.object({
  status: UserStatusSchema,
});

export type UpdateUserStatusRequest = z.infer<typeof UpdateUserStatusRequestSchema>;
