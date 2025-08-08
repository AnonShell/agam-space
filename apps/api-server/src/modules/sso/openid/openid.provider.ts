import { createHash } from 'crypto';
import { randomBytes } from 'crypto';
import {
  OidcConfig,
  OidcMetadata,
  OidcMetadataSchema,
  TokenSet,
  UserInfo,
  UserInfoSchema,
} from '@/modules/sso/openid/openid.types';

export class OidcProvider {
  private metadata: OidcMetadata;

  constructor(private readonly config: OidcConfig) {}

  async init(): Promise<void> {
    const res = await fetch(`${this.config.issuer}/.well-known/openid-configuration`);
    const raw = await res.json();

    const parsed = OidcMetadataSchema.safeParse(raw);
    if (!parsed.success) {
      throw new Error(`Invalid OIDC metadata: ${parsed.error.message}`);
    }

    this.metadata = parsed.data;
  }

  generateCodeVerifier(): { verifier: string; challenge: string } {
    const verifier = randomBytes(32).toString('base64url');
    const challenge = createHash('sha256').update(verifier).digest().toString('base64url');
    return { verifier, challenge };
  }

  getAuthorizationUrl(codeChallenge: string, state: string): string {
    const url = new URL(this.metadata.authorization_endpoint);
    url.searchParams.set('client_id', this.config.clientId);
    url.searchParams.set('redirect_uri', this.config.redirectUri);
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('scope', 'openid profile email');
    url.searchParams.set('code_challenge', codeChallenge);
    url.searchParams.set('code_challenge_method', 'S256');
    url.searchParams.set('state', state);
    return url.toString();
  }

  async exchangeCode(code: string, verifier: string): Promise<TokenSet> {
    const res = await fetch(this.metadata.token_endpoint, {
      method: 'POST',
      headers: {
        'content-type': 'application/x-www-form-urlencoded',
        authorization:
          'Basic ' +
          Buffer.from(`${this.config.clientId}:${this.config.clientSecret}`).toString('base64'),
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: this.config.redirectUri,
        code_verifier: verifier,
      }),
    });

    const json = await res.json();
    if (!json.access_token) throw new Error('Token exchange failed');
    return json;
  }

  async getUserInfo(accessToken: string): Promise<UserInfo> {
    const res = await fetch(this.metadata.userinfo_endpoint, {
      headers: {
        authorization: `Bearer ${accessToken}`,
      },
    });

    const userRaw = await res.json();
    return UserInfoSchema.parse(userRaw);
  }
}
