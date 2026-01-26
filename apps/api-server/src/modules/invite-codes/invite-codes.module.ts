import { forwardRef, Module } from '@nestjs/common';
import { InviteCodesService } from './invite-codes.service';
import { InviteCodesController } from './invite-codes.controller';
import { InviteCodesPublicController } from './invite-codes.public.controller';
import { AuthModule } from '@/modules/auth/auth.module';

@Module({
  imports: [forwardRef(() => AuthModule)],
  providers: [InviteCodesService],
  controllers: [InviteCodesController, InviteCodesPublicController],
  exports: [InviteCodesService],
})
export class InviteCodesModule {}
