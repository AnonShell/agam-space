import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { AppConfigService } from '../../config/config.service';
import { DatabaseService } from '../../database/database.service';
import { ServerConfigService } from '@/modules/server-info/service/server-config.service';
import { ServerConfigDto } from '@/modules/server-info/types';

@ApiTags('server')
@Controller('/server')
export class ServerInfoController {
  constructor(
    private configService: AppConfigService,
    private databaseService: DatabaseService,
    private readonly serverConfigService: ServerConfigService
  ) {}

  @Get('/health')
  @ApiOperation({ summary: 'Health check endpoint' })
  @ApiResponse({ status: 200, description: 'Server is healthy' })
  async getHealth() {
    const server = this.configService.getServer();
    const dbHealthy = await this.databaseService.healthCheck();

    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'Agam Space',
      version: process.env.APP_VERSION || '1.0.0',
      environment: server?.nodeEnv || 'production',
      server: {
        host: this.configService.getHost(),
        port: this.configService.getPort(),
        apiPrefix: this.configService.getApiPrefix(),
      },
      database: {
        healthy: dbHealthy,
      },
      uptime: process.uptime(),
    };
  }

  @Get('/config')
  @ApiOperation({ summary: 'Get server configuration' })
  @ApiResponse({
    status: 200,
    description: 'Server configuration retrieved successfully',
    type: ServerConfigDto,
  })
  getConfig(): ServerConfigDto {
    return this.serverConfigService.getConfig();
  }
}
