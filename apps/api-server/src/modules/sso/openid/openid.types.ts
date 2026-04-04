import { z } from 'zod';

export const OidcMetadataSchema = z.object({
  issuer: z.string().url(),
  authorization_endpoint: z.string().url(),
  token_endpoint: z.string().url(),
  userinfo_endpoint: z.string().url(),
});

export type OidcMetadata = z.infer<typeof OidcMetadataSchema>;

export interface OidcConfig {
  issuer: string;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

export const TokenSetSchema = z
  .object({
    access_token: z.string().min(1),
    id_token: z.string().min(1).optional(),
    expires_in: z.number().int().positive().optional(),
  })
  .passthrough();

export type TokenSet = z.infer<typeof TokenSetSchema>;

export const UserInfoSchema = z
  .object({
    sub: z.string(),
    email: z.string().email().nullish(),
    email_verified: z.boolean().nullish(),
    name: z.string().min(1).max(200).nullish(),
    preferred_username: z.string().min(1).max(200),
  })
  .passthrough();

export type UserInfo = z.infer<typeof UserInfoSchema>;
