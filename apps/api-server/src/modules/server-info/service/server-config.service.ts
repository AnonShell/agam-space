import { Injectable, OnModuleInit } from '@nestjs/common';
import { AppConfigService } from '@/config/config.service';
import { ServerConfig, ServerConfigSchema } from '@agam-space/shared-types';
import { createHash } from 'crypto';
import { SsoService } from '@/modules/sso/sso.service';

@Injectable()
export class ServerConfigService implements OnModuleInit {
  private config: ServerConfig;
  private eTag: string;
  private isSsoEnabled: boolean = false;

  constructor(
    private configService: AppConfigService,
    private readonly ssoService: SsoService
  ) {}

  async onModuleInit() {
    this.isSsoEnabled = this.ssoService.isEnabled();
    this.config = this.loadConfig();
    this.eTag = this.generateETag(this.config);
    console.log('ServerConfigService initialized with config:', JSON.stringify(this.config));
  }

  getConfig(): ServerConfig {
    return this.config;
  }

  getEtag(): string {
    return this.eTag;
  }

  private loadConfig(): ServerConfig {
    const partialConfig = {
      upload: {
        chunkSize: this.configService.getConfig().files.chunkSize,
        maxFileSize: this.configService.getConfig().files.maxFileSize,
        maxConcurrency: this.configService.getConfig().files.uploadConcurrency,
      },
      features: {
        publicSharing: false,
        encryptedTags: false,
        fileVersioning: false,
        externalApiAccess: false,
      },
      security: {
        sessionTimeout: this.configService.getSecurity().sessionTimeout,
      },
      account: {
        allowNewSignup: this.configService.getConfig().account.allowNewSignup,
        defaultUserStorageQuota: this.configService.getConfig().account.defaultUserStorageQuota,
      },
      sso: {
        enabled: this.isSsoEnabled,
      },
    };

    return ServerConfigSchema.parse(partialConfig);
  }

  private generateETag(config: ServerConfig) {
    return createHash('sha1').update(JSON.stringify(config)).digest('hex');
  }
}
