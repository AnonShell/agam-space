import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { configLoader } from './config.loader';
import { AppConfigService } from './config.service';

@Global()
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [() => configLoader.loadConfig()],
      envFilePath: ['.env.local', '.env'],
    }),
  ],
  providers: [AppConfigService],
  exports: [AppConfigService],
})
export class AppConfigModule {}
