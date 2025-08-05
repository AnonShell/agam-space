import { z } from 'zod';
import { UserKeysSchema } from '../user-keys-setup.schema';

export const E2eeChallengeSchema = z.object({
  signature: z
    .string()
    .min(44)
    .max(100)
    .regex(/^[A-Za-z0-9+/]*={0,2}$/, 'Invalid base64 signature')
    .describe('Signature of the challenge, base64 encoded'),
  timestamp: z.number().int().min(1).describe('Timestamp of the challenge'),
});

export type E2eeChallenge = z.infer<typeof E2eeChallengeSchema>;

export const ResetCmkPasswordRequestSchema = z.object({
  challengeData: E2eeChallengeSchema,
  encCmkWithPassword: UserKeysSchema.shape.encCmkWithPassword,
});

export type ResetCmkPasswordRequest = z.infer<typeof ResetCmkPasswordRequestSchema>;

export const ResetRecoveryKeyRequestSchema = z.object({
  challengeData: E2eeChallengeSchema,
  encCmkWithRecovery: UserKeysSchema.shape.encCmkWithRecovery,
  encRecoveryWithCmk: UserKeysSchema.shape.encRecoveryWithCmk,
});

export type ResetRecoveryKeyRequest = z.infer<typeof ResetRecoveryKeyRequestSchema>;
