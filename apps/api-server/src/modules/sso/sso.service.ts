import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { OidcProvider } from '@/modules/sso/openid/openid.provider';
import { ConfigService } from '@nestjs/config';
import { UserInfo } from '@/modules/sso/openid/openid.types';

@Injectable()
export class SsoService implements OnModuleInit {
  private logger = new Logger(SsoService.name);
  private provider: OidcProvider | null = null;

  //Temporary storage for verifiers
  private verifierStore = new Map<string, string>();

  constructor(private readonly config: ConfigService) {}

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

  generateVerifier(state: string): string {
    if (!this.provider) throw new Error('SSO not enabled');
    const { verifier } = this.provider.generateCodeVerifier();
    this.verifierStore.set(state, verifier);
    return verifier;
  }

  consumeVerifier(state: string): string | undefined {
    const verifier = this.verifierStore.get(state);
    this.verifierStore.delete(state);
    return verifier;
  }
}
