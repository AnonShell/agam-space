import { CacheModule } from '@nestjs/cache-manager';
import { forwardRef, Module } from '@nestjs/common';

import { AuthController } from './controllers/auth.controller';
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
 *
 * Features:
 * - Session-based authentication (no JWT)
 * - Argon2 password hashing
 * - Database session management with caching
 * - Client-side encryption (CMK/recovery keys)
 * - Device tracking
 * - Multi-session support
 *
 * Exports:
 * - AuthService: Core authentication logic
 * - AuthGuard: Route protection
 * - UserService: User management (for other modules)
 * - UserKeysService: Encryption key management
 */
@Module({
  imports: [
    // Cache module for session optimization
    CacheModule.register({
      ttl: 2 * 60 * 1000, // 2 minutes TTL
      max: 1000, // Maximum 1000 cached sessions
    }),
    SsoModule,
    forwardRef(() => UserQuotaModule),
  ],
  controllers: [AuthController, MeController, UserController, AdminUserController],
  providers: [
    // Core services
    AuthService,
    UserService,
    SessionService,
    PasswordService,

    // Guards
    AuthGuard,
  ],
  exports: [
    // Export services for use in other modules
    AuthService,
    UserService,
    SessionService,

    // Export guards for use in other modules
    AuthGuard,
  ],
})
export class AuthModule {}
