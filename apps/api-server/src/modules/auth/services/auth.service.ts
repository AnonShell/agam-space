import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';

import {
  ChangeLoginPasswordRequest,
  LoginResponse,
  User,
  UserRole,
  UserStatus,
} from '@agam-space/shared-types';
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

    if (!username || !password) {
      throw new BadRequestException('Username and password are required');
    }

    if (password.length < 8) {
      throw new BadRequestException('Password must be at least 8 characters');
    }

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

    if (!username || !password) {
      throw new BadRequestException('Username and password are required');
    }

    const user = await this.userService.findUserEntityForAuth(username);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.passwordHash) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isValidPassword = await this.passwordService.verifyPassword(password, user.passwordHash);
    if (!isValidPassword) {
      throw new UnauthorizedException('Invalid credentials');
    }

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

    await this.userService.updateLastLogin(sessionData.userId);

    return { session, rawToken };
  }

  async validateSession(sessionToken: string): Promise<SessionContext | null> {
    if (!sessionToken) {
      return null;
    }

    const session = await this.sessionService.findActiveSession(sessionToken);
    if (!session) {
      return null;
    }

    const user = await this.userService.findUserById(session.userId);
    if (!user || user.status !== UserStatus.ACTIVE) {
      await this.sessionService.deleteSession(sessionToken);
      return null;
    }

    return {
      sessionId: session.id,
      userId: user.id,
      user: {
        id: user.id,
        username: user.username,
        role: user.role as UserRole,
      },
    };
  }

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

  async changeLoginPassword(userId: string, request: ChangeLoginPasswordRequest): Promise<void> {
    const userInfo = await this.userService.findUserById(userId);
    if (!userInfo) {
      throw new NotFoundException('User not found');
    }

    if (userInfo.status !== UserStatus.ACTIVE) {
      throw new ForbiddenException(`Cannot change password. Account status: ${userInfo.status}`);
    }

    if (userInfo.oidcSubject) {
      throw new ForbiddenException('SSO users cannot change login password');
    }

    const isValidPassword = await this.userService.verifyPassword(userId, request.currentPassword);
    if (!isValidPassword) {
      throw new UnauthorizedException('Current login password is incorrect');
    }

    await this.userService.updatePassword(userId, request.newPassword);

    this.logger.log(`Login password changed successfully for user: ${userId}`);
  }

  async updateUserStatus(adminId: string, targetUserId: string, status: UserStatus): Promise<void> {
    if (adminId === targetUserId) {
      throw new ForbiddenException('Cannot modify your own account status');
    }

    await this.userService.updateUserStatus(targetUserId, status);

    if (status === UserStatus.DISABLED || status === UserStatus.DELETED) {
      await this.sessionService.deleteAllUserSessions(targetUserId);
    }

    this.logger.log(`User ${targetUserId} status changed to ${status} by admin ${adminId}`);
  }
}
