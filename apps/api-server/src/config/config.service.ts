import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import type { AppConfig } from './config.schema';

/**
 * Wrapper around NestJS ConfigService for easier access to our configuration
 * This handles the fact that NestJS stores our config sections as separate keys
 */
@Injectable()
export class AppConfigService {
  constructor(private configService: ConfigService) {}

  /**
   * Get the full configuration object
   */
  getConfig(): AppConfig {
    return {
      server: this.configService.get('server'),
      cors: this.configService.get('cors'),
      docs: this.configService.get('docs'),
      database: this.configService.get('database'),
      directories: this.configService.get('directories'),
      security: this.configService.get('security'),
      sso: this.configService.get('sso'),
    } as AppConfig;
  }

  /**
   * Get server configuration
   */
  getServer() {
    return this.configService.get('server');
  }

  /**
   * Get database configuration
   */
  getDatabase() {
    return this.configService.get('database');
  }

  /**
   * Get directories configuration
   */
  getDirectories() {
    return this.configService.get('directories');
  }

  /**
   * Get CORS configuration
   */
  getCors() {
    return this.configService.get('cors');
  }

  /**
   * Get docs configuration
   */
  getDocs() {
    return this.configService.get('docs');
  }

  /**
   * Get security configuration
   */
  getSecurity() {
    return this.configService.get('security');
  }

  getSso() {
    return this.configService.get('sso');
  }

  /**
   * Check if docs are enabled
   */
  isDocsEnabled(): boolean {
    return this.getDocs()?.enabled || false;
  }

  /**
   * Get the API prefix
   */
  getApiPrefix(): string {
    return this.getServer()?.apiPrefix || 'api/v1';
  }

  /**
   * Get the server port
   */
  getPort(): number {
    return this.getServer()?.port || 3331;
  }

  /**
   * Get the server host
   */
  getHost(): string {
    return this.getServer()?.host || '0.0.0.0';
  }
}
