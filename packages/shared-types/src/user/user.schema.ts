import { z } from 'zod';
import { UserRole, UserStatus } from './user.types';
import { datetimeSchema } from '../common.schema';

export const UserRoleSchema = z.nativeEnum(UserRole);
export const UserStatusSchema = z.nativeEnum(UserStatus);

export const UserSchema = z.object({
  id: z.string().min(20).max(50),
  username: z.string().min(1).max(50),
  email: z.string().email().nullable().optional(),
  isEmailVerified: z.boolean().default(false),
  role: UserRoleSchema,
  oidcProvider: z.string().min(1).max(50).nullable(),
  oidcSubject: z.string().min(1).max(50).nullable(),
  createdAt: datetimeSchema,
  updatedAt: datetimeSchema,
  lastLoginAt: datetimeSchema.nullable(),
  status: UserStatusSchema.default(UserStatus.ACTIVE),
});

export const UsersArraySchema = z.array(UserSchema);

export type User = z.infer<typeof UserSchema>;
export type UsersArray = z.infer<typeof UsersArraySchema>;
