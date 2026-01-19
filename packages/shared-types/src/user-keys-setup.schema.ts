import { z } from 'zod';
import { datetimeSchema } from './common.schema';

const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;

export const KdfMetadataSchema = z
  .object({
    version: z.string().min(1).max(10),
    type: z
      .string()
      .min(1)
      .max(20)
      .regex(/^(argon2id)$/),
    salt: z.string().min(22).max(100).regex(base64Regex),
    params: z.object({
      iterations: z.number().int().positive(),
      memory: z.number().int().positive(),
      hashLength: z.number().int().positive(),
    }),
  })
  .strict();

export const UserKeysSchema = z
  .object({
    userId: z.string().min(1).max(50),
    createdAt: datetimeSchema,
    updatedAt: datetimeSchema,
    kdfMetadata: KdfMetadataSchema,
    encryptionVersion: z.string().min(1).max(10),
    encCmkWithPassword: z
      .string()
      .min(44)
      .regex(base64Regex, 'Invalid base64 encrypted CMK with password')
      .describe('CMK encrypted with password, base64 encoded'),
    encCmkWithRecovery: z
      .string()
      .min(44)
      .regex(base64Regex, 'Invalid base64 encrypted CMK with recovery key')
      .describe('CMK encrypted with recovery key, base64 encoded'),
    encRecoveryWithCmk: z
      .string()
      .min(44)
      .regex(base64Regex, 'Invalid base64 recovery key encrypted with CMK')
      .describe('Recovery key encrypted with CMK, base64 encoded'),
    identityPublicKey: z.string().min(44).max(70).regex(base64Regex),
    encIdentitySeed: z
      .string()
      .min(44)
      .regex(base64Regex)
      .describe('Identity seed encrypted with CMK, base64 encoded')
      .nullable(),
    identityEncPubKey: z
      .string()
      .min(44)
      .max(70)
      .regex(base64Regex)
      .describe('X25519 public key for encryption, base64 encoded')
      .nullable(),
    identityFingerprint: z
      .string()
      .regex(/^[a-z]+-[a-z]+-[a-z]+-[a-z]+$/)
      .describe('Human-readable 4-word EFF fingerprint')
      .nullable(),
  })
  .strict();

export const UserKeysSetupSchema = UserKeysSchema.pick({
  kdfMetadata: true,
  encryptionVersion: true,
  encCmkWithPassword: true,
  encCmkWithRecovery: true,
  encRecoveryWithCmk: true,
  identityPublicKey: true,
  encIdentitySeed: true,
  identityEncPubKey: true,
})
  .extend({
    encIdentitySeed: z
      .string()
      .min(44)
      .regex(base64Regex)
      .describe('Identity seed encrypted with CMK, base64 encoded'),
    identityEncPubKey: z
      .string()
      .min(44)
      .max(70)
      .regex(base64Regex)
      .describe('X25519 public key for encryption, base64 encoded'),
  })
  .strip();

export type KdfMetadata = z.infer<typeof KdfMetadataSchema>;
export type UserKeys = z.infer<typeof UserKeysSchema>;
export type UserKeysSetup = z.infer<typeof UserKeysSetupSchema>;
