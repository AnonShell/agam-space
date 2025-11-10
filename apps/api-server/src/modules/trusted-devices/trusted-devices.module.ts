import { AuthModule } from '@/modules/auth/auth.module';
import { TrustedDevicesController } from '@/modules/trusted-devices/trusted-devices.controller';
import { TrustedDevicesService } from '@/modules/trusted-devices/trusted-devices.service';
import { WebAuthnService } from '@/modules/trusted-devices/webauthn.service';
import { AppConfigModule } from '@/config/config.module';
import { forwardRef, Module } from '@nestjs/common';

@Module({
  imports: [forwardRef(() => AuthModule), AppConfigModule],
  controllers: [TrustedDevicesController],
  providers: [TrustedDevicesService, WebAuthnService],
  exports: [TrustedDevicesService, WebAuthnService],
})
export class TrustedDevicesModule {}
