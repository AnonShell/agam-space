import { z } from 'zod';
import { UserRole } from './user.types';
import { datetimeSchema } from '../common.schema';

export const UserRoleSchema = z.nativeEnum(UserRole);
export type UserRoleType = z.infer<typeof UserRoleSchema>;

export const UserSchema = z.object({
  id: z.string().min(20).max(50),
  username: z.string().min(1).max(50),
  email: z.string().email().nullable().optional(),
  isEmailVerified: z.boolean().default(false),
  role: UserRoleSchema,
  isActive: z.boolean().default(true),
  oidcProvider: z.string().min(1).max(50).nullable(),
  oidcSubject: z.string().min(1).max(50).nullable(),
  createdAt: datetimeSchema,
  updatedAt: datetimeSchema,
  lastLoginAt: datetimeSchema.nullable(),
});

export type User = z.infer<typeof UserSchema>;
