import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { OidcProvider } from '@/modules/sso/openid/openid.provider';
import { ConfigService } from '@nestjs/config';
import { UserInfo } from '@/modules/sso/openid/openid.types';
import { randomBytes } from 'crypto';
import type { Cache } from 'cache-manager';

interface OidcVerifierContext {
  verifier: string;
  clientType: string;
}

@Injectable()
export class SsoService implements OnModuleInit {
  private logger = new Logger(SsoService.name);
  private provider: OidcProvider | null = null;

  private readonly OIDC_STATE_TTL_MS = 5 * 60 * 1000;
  private readonly OIDC_STATE_CACHE_PREFIX = 'oidc:state:';

  constructor(
    private readonly config: ConfigService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache
  ) {}

  private getOidcStateCacheKey(state: string): string {
    return `${this.OIDC_STATE_CACHE_PREFIX}${state}`;
  }

  async onModuleInit() {
    const sso = this.config.get('sso');
    if (!sso) {
      this.logger.log('SSO config not present — skipping SSO setup');
      return;
    }

    try {
      const provider = new OidcProvider(sso);
      await provider.init();
      this.provider = provider;
      this.logger.log(`SSO provider initialized: ${sso.issuer}`);
    } catch (err) {
      this.logger.error(`Failed to initialize SSO provider: ${err}`);
      this.provider = null;
    }
  }

  isEnabled(): boolean {
    return this.provider !== null;
  }

  getAuthorizationUrl(codeChallenge: string, state: string): string {
    if (!this.provider) throw new Error('SSO not enabled');
    return this.provider.getAuthorizationUrl(codeChallenge, state);
  }

  async exchangeCode(code: string, verifier: string): Promise<UserInfo> {
    if (!this.provider) throw new Error('SSO not enabled');
    const token = await this.provider.exchangeCode(code, verifier);
    return this.provider.getUserInfo(token.access_token);
  }

  async createVerifierContext(clientType: string): Promise<{ state: string; challenge: string }> {
    if (!this.provider) throw new Error('SSO not enabled');

    const state = randomBytes(32).toString('base64url');
    const { verifier, challenge } = this.provider.generateCodeVerifier();
    const cacheKey = this.getOidcStateCacheKey(state);

    await this.cacheManager.set<OidcVerifierContext>(
      cacheKey,
      { verifier, clientType },
      this.OIDC_STATE_TTL_MS
    );

    return { state, challenge };
  }

  async consumeVerifierContext(state: string): Promise<OidcVerifierContext | null> {
    const cacheKey = this.getOidcStateCacheKey(state);
    const context = await this.cacheManager.get<OidcVerifierContext>(cacheKey);
    await this.cacheManager.del(cacheKey);
    return context ?? null;
  }
}
