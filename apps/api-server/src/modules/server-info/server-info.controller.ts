import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { AppConfigService } from '../../config/config.service';
import { DatabaseService } from '../../database/database.service';
import { ServerConfigService } from '@/modules/server-info/service/server-config.service';
import { ServerConfigDto } from '@/modules/server-info/types';
import { APP_CONSTANTS } from '@/config/config.schema';

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
    const dbHealthy = await this.databaseService.healthCheck();

    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      database: dbHealthy ? 'ok' : 'unhealthy',
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

  @Get('/info')
  @ApiOperation({ summary: 'Get server information' })
  @ApiResponse({
    status: 200,
    description: 'Server Information retrieved successfully',
  })
  getServerInfo() {

    const server = this.configService.getServer();
    return {
      version: APP_CONSTANTS.version,
      timestamp: new Date().toISOString(),
      environment: server.nodeEnv || 'production',
    };
  }
}
