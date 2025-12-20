import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';

import { ChallengeVerificationService } from './challenge-verification.service';
import { E2eeController } from './e2ee.controller';
import { E2eeKeysService } from './e2ee-keys.service';

@Module({
  imports: [AuthModule],
  controllers: [E2eeController],
  providers: [E2eeKeysService, ChallengeVerificationService],
  exports: [E2eeKeysService, ChallengeVerificationService],
})
export class E2eeKeysModule {}
