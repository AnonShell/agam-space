import { BadRequestException, Injectable, Logger, UnauthorizedException } from '@nestjs/common';

import { LoginResponse, User, UserRole, UserStatus } from '@agam-space/shared-types';
import { AppConfigService } from '@/config/config.service';
import { CreateUserData, UserService } from '../user.service';
import { PasswordService } from './password.service';
import { CreateSessionData, SessionService } from './session.service';
import { AuthenticatedUser } from '@/modules/auth/dto/auth.dto';
import type { UserSession } from '@/database';
import { UserInfo } from '@/modules/sso/openid/openid.types';

export interface SignupRequest {
  username: string;
  password: string;
  email?: string;
}

export interface LoginRequest {
  username: string; // Can be username or email
  password: string;
  deviceFingerprint?: string;
  userAgent?: string;
  ipAddress?: string;
}

export interface SessionContext {
  sessionId: string;
  sessionToken: string;
  userId: string;
  user: AuthenticatedUser;
}

/**
 * Authentication service handling signup, login, logout, and session management
 * Orchestrates UserService, PasswordService, and SessionService
 */
@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly userService: UserService,
    private readonly sessionService: SessionService,
    private readonly passwordService: PasswordService,
    private readonly configService: AppConfigService
  ) {}

  async signup(request: SignupRequest): Promise<User> {
    if (!this.configService.getConfig().account.allowNewSignup) {
      throw new BadRequestException('New user registration is currently disabled');
    }

    const { username, password, email } = request;

    // Validate required fields
    if (!username || !password) {
      throw new BadRequestException('Username and password are required');
    }

    if (password.length < 8) {
      throw new BadRequestException('Password must be at least 8 characters');
    }

    // Create user
    const userData: CreateUserData = {
      username,
      password,
      email,
    };

    const user = await this.userService.createUser(userData);

    this.logger.log(`User signed up: ${user.username} (${user.id})`);
    return user;
  }

  /**
   * Authenticate user and create session (login)
   */
  async login(request: LoginRequest): Promise<LoginResponse> {
    const { username, password, deviceFingerprint, userAgent, ipAddress } = request;

    // Validate required fields
    if (!username || !password) {
      throw new BadRequestException('Username and password are required');
    }

    // Find user by username or email
    const user = await this.userService.findUserEntityForAuth(username);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Verify password
    if (!user.passwordHash) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isValidPassword = await this.passwordService.verifyPassword(password, user.passwordHash);
    if (!isValidPassword) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Create session - now returns both session and raw token
    const sessionData: CreateSessionData = {
      userId: user.id,
      deviceFingerprint,
      userAgent,
      ipAddress,
    };

    const { session, rawToken } = await this.createUserSession(sessionData);

    this.logger.log(`User logged in: ${user.username} (${user.id})`);
    return {
      user: this.userService.toUserDto(user),
      session: {
        token: rawToken,
        expiresAt: session.expiresAt.toISOString(),
      },
    };
  }

  async authSSO(
    userInfo: UserInfo,
    device: {
      deviceFingerprint?: string;
      userAgent?: string;
      ipAddress?: string;
    }
  ): Promise<LoginResponse> {
    this.logger.log(`Authenticated user from sso: ${userInfo.preferred_username}`);

    let user = await this.userService.findUserForAuth(userInfo.preferred_username);
    if (!user) {
      const accountConfig = this.configService.getConfig().account;
      const ssoConfig = this.configService.getConfig().sso;

      if (!accountConfig.allowNewSignup) {
        throw new UnauthorizedException('New user registration is disabled.');
      }

      if (!ssoConfig?.autoCreateUser) {
        throw new UnauthorizedException('User not found. SSO auto-create is disabled.');
      }

      const newUserData: CreateUserData = {
        username: userInfo.preferred_username,
        email: userInfo.email,
        oidcSubject: userInfo.sub,
      };

      user = await this.userService.createUser(newUserData, true);
      this.logger.log(`Auto created new user from sso : ${user.username} (${user.id})`);
    }

    // Create session - now returns both session and raw token
    const sessionData: CreateSessionData = {
      userId: user.id,
      ...device,
    };

    const { session, rawToken } = await this.createUserSession(sessionData);

    this.logger.log(`User logged in: ${user.username} (${user.id})`);
    return {
      user,
      session: {
        token: rawToken,
        expiresAt: session.expiresAt.toISOString(),
      },
    };
  }

  async createUserSession(
    sessionData: CreateSessionData
  ): Promise<{ session: UserSession; rawToken: string }> {
    const { session, rawToken } = await this.sessionService.createSession(sessionData);

    this.logger.log(`Session created for user ${sessionData.userId}: ${session.id}`);

    // Update last login
    await this.userService.updateLastLogin(sessionData.userId);

    return { session, rawToken };
  }

  /**
   * Validate session token and return user context
   */
  async validateSession(sessionToken: string): Promise<SessionContext | null> {
    if (!sessionToken) {
      return null;
    }

    // Find active session
    const session = await this.sessionService.findActiveSession(sessionToken);
    if (!session) {
      return null;
    }

    // Get user data
    const user = await this.userService.findUserById(session.userId);
    if (!user || user.status !== UserStatus.ACTIVE) {
      // Session exists but user doesn't - clean up session
      await this.sessionService.deleteSession(sessionToken);
      return null;
    }

    return {
      sessionId: session.id,
      sessionToken: sessionToken,
      userId: user.id,
      user: {
        id: user.id,
        username: user.username,
        role: user.role as UserRole,
      },
    };
  }

  /**
   * Logout from current session
   */
  async logout(sessionToken: string): Promise<boolean> {
    if (!sessionToken) {
      return false;
    }

    const session = await this.sessionService.findActiveSession(sessionToken);
    if (!session) {
      return false;
    }

    const success = await this.sessionService.deleteSession(session.id);
    if (success) {
      this.logger.log(`Session logged out: ${session.id.slice(0, 8)}...`);
    }

    return success;
  }

  /**
   * Administrative cleanup of expired sessions
   */
  async cleanupExpiredSessions(): Promise<number> {
    return await this.sessionService.cleanupExpiredSessions();
  }
}
