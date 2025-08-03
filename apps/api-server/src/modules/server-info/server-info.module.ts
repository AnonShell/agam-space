import { Module } from '@nestjs/common';
import { ServerInfoController } from '@/modules/server-info/server-info.controller';
import { ServerConfigService } from '@/modules/server-info/service/server-config.service';
import { SsoModule } from '@/modules/sso/sso.module';

@Module({
  imports: [SsoModule],
  controllers: [ServerInfoController],
  providers: [ServerConfigService],
})
export class ServerInfoModule {}
