import { z } from 'zod';

export const EncryptedEnvelopeSchema = z.object({
  v: z.number().min(1).max(255),
  n: z.custom<Uint8Array>((val) => val instanceof Uint8Array).refine(n => n.length > 0, 'Nonce must not be empty'),
  c: z.custom<Uint8Array>((val) => val instanceof Uint8Array).refine(c => c.length > 0, 'Ciphertext must not be empty'),
});

export type EncryptedEnvelope = z.infer<typeof EncryptedEnvelopeSchema>;
