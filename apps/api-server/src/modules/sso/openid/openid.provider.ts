import { createHash } from 'crypto';
import { randomBytes } from 'crypto';
import {
  OidcConfig,
  OidcMetadata,
  OidcMetadataSchema,
  TokenSetSchema,
  TokenSet,
  UserInfo,
  UserInfoSchema,
} from '@/modules/sso/openid/openid.types';
import { httpRequestJson } from '@/common/helpers/http-request';

export class OidcProvider {
  private metadata: OidcMetadata;
  private readonly FETCH_TIMEOUT_MS = 5000;

  constructor(private readonly config: OidcConfig) {}

  private normalizeIssuer(issuer: string): string {
    return issuer.replace(/\/+$/, '');
  }

  async init(): Promise<void> {
    const raw = await httpRequestJson(`${this.config.issuer}/.well-known/openid-configuration`, {
      timeoutMs: this.FETCH_TIMEOUT_MS,
      errorContext: 'OIDC metadata',
    });

    const parsed = OidcMetadataSchema.safeParse(raw);
    if (!parsed.success) {
      throw new Error(`Invalid OIDC metadata: ${parsed.error.message}`);
    }

    if (this.normalizeIssuer(parsed.data.issuer) !== this.normalizeIssuer(this.config.issuer)) {
      throw new Error('OIDC metadata issuer does not match configured issuer');
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
    const json = await httpRequestJson(this.metadata.token_endpoint, {
      timeoutMs: this.FETCH_TIMEOUT_MS,
      errorContext: 'OIDC token',
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
    const parsed = TokenSetSchema.safeParse(json);
    if (!parsed.success) {
      throw new Error(`Invalid OIDC token response: ${parsed.error.message}`);
    }

    return parsed.data;
  }

  async getUserInfo(accessToken: string): Promise<UserInfo> {
    const userRaw = await httpRequestJson(this.metadata.userinfo_endpoint, {
      timeoutMs: this.FETCH_TIMEOUT_MS,
      errorContext: 'OIDC userinfo',
      headers: {
        authorization: `Bearer ${accessToken}`,
      },
    });
    return UserInfoSchema.parse(userRaw);
  }
}
