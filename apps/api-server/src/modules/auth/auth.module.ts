import { CacheModule } from '@nestjs/cache-manager';
import { forwardRef, Module } from '@nestjs/common';

import { AuthController } from './controllers/auth.controller';
import { SessionController } from './controllers/session.controller';
import { AuthGuard } from './auth.guard';
import { AuthService } from './services/auth.service';
import { PasswordService } from './services/password.service';
import { SessionService } from './services/session.service';
import { UserService } from './user.service';
import { SsoModule } from '@/modules/sso/sso.module';
import { MeController } from '@/modules/auth/controllers/me.controller';
import { UserQuotaModule } from '@/modules/quota/quota.module';
import { UserController } from '@/modules/auth/controllers/user.controller';
import { AdminUserController } from '@/modules/auth/controllers/user.admin.controller';

/**
 * Authentication module providing complete user authentication system
 */
@Module({
  imports: [
    CacheModule.register({
      ttl: 2 * 60 * 1000,
      max: 1000,
    }),
    SsoModule,
    forwardRef(() => UserQuotaModule),
  ],
  controllers: [
    AuthController,
    SessionController,
    MeController,
    UserController,
    AdminUserController,
  ],
  providers: [AuthService, UserService, SessionService, PasswordService, AuthGuard],
  exports: [AuthService, UserService, SessionService, AuthGuard],
})
export class AuthModule {}
