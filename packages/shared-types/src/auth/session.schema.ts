import { z } from 'zod';

export const SessionCryptoMaterialSchema = z.object({
  nonce: z.string(),
  expiresAt: z.number().int().positive(),
  isNew: z.boolean().default(false),
});

export type SessionCryptoMaterial = z.infer<typeof SessionCryptoMaterialSchema>;
