import { z } from 'zod';
import { UserSchema } from '../user/user.schema';

export const UserPasswordSchema = z.string().min(8).max(100);

export const LoginWithPasswordRequestSchema = z.object({
  username: z.string().min(1).max(50),
  password: UserPasswordSchema,
});

export const LoginResponseSchema = z.object({
  user: UserSchema,
  session: z.object({
    token: z.string().min(20).max(100),
    refreshToken: z.string().min(20).max(100).nullish(),
    expiresAt: z.string().datetime(),
  }),
});

export type LoginResponse = z.infer<typeof LoginResponseSchema>;

export const NewUserSignupRequestSchema = UserSchema.pick({
  username: true,
  email: true,
}).extend({
  email: UserSchema.shape.email.nullish(),
  password: UserPasswordSchema,
  inviteCode: z.string().min(1).max(20).optional(),
});

export type NewSignupUserRequest = z.infer<typeof NewUserSignupRequestSchema>;

export const ChangeLoginPasswordRequestSchema = z.object({
  currentPassword: UserPasswordSchema,
  newPassword: UserPasswordSchema,
});

export type ChangeLoginPasswordRequest = z.infer<typeof ChangeLoginPasswordRequestSchema>;
