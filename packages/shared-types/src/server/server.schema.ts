import { z } from 'zod';

// client config

export const ServerConfigSchema = z.object({
  upload: z.object({
    chunkSize: z.number(),
    maxFileSize: z.number(),
    maxConcurrency: z.number().default(1),
  }),
  features: z.object({
    publicSharing: z.boolean().default(false),
    encryptedTags: z.boolean().default(false),
    fileVersioning: z.boolean().default(false),
    externalApiAccess: z.boolean().default(false),
  }),
  security: z.object({
    allowNewSignup: z.boolean(),
    sessionTimeout: z.string(),
  }),
  sso: z.object({
    enabled: z.boolean().default(false),
  }),
});

export type ServerConfig = z.infer<typeof ServerConfigSchema>;
