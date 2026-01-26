import { z } from 'zod';
import { datetimeSchema } from '../common.schema';

export const CreateInviteRequestSchema = z.object({
  maxUses: z.number().int().min(1).max(100).optional(),
  email: z.string().email().optional(),
  expiresAt: datetimeSchema.optional(),
});
export type CreateInviteRequest = z.infer<typeof CreateInviteRequestSchema>;

export const CreateInviteResponseSchema = z.object({
  code: z.string(),
  inviteUrl: z.string(),
});
export type CreateInviteResponse = z.infer<typeof CreateInviteResponseSchema>;

export const InviteCodeSchema = z.object({
  id: z.string().min(1).max(20),
  createdBy: z.string().min(1),
  createdAt: datetimeSchema,
  expiresAt: datetimeSchema.nullish(),
  maxUses: z.number().int().min(1),
  currentUses: z.number().int().min(0),
  email: z.string().email().nullish(),
});

export const InviteCodeListSchema = z.array(InviteCodeSchema);

export type InviteCode = z.infer<typeof InviteCodeSchema>;
export type InviteCodeList = z.infer<typeof InviteCodeListSchema>;

export const ValidateInviteCodeResponseSchema = z.object({
  valid: z.boolean(),
  reason: z.string().optional(),
  assignedEmail: z.string().email().nullable().optional(),
});

export type ValidateInviteCodeResponse = z.infer<typeof ValidateInviteCodeResponseSchema>;
