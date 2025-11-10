import { BadRequestException, ConflictException, forwardRef, Inject, Injectable, Logger } from '@nestjs/common';
import { and, eq, or } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';

import { DATABASE_CONNECTION } from '../../database/database.providers';
import { type NewUser, type UserDB, users } from '../../database/schema';

import { UserRole } from './auth.models';
import { PasswordService } from './services/password.service';
import { User, UserSchema, UserStatus, UserStatusSchema } from '@agam-space/shared-types';
import { QuotaService } from '@/modules/quota/quota.service';
import { AppConfigService } from '@/config/config.service';

export interface CreateUserData {
  username: string;
  email?: string;
  password?: string;
  role?: UserRole;
  oidcProvider?: string;
  oidcSubject?: string;
}

export type UserWithoutSensitive = Omit<UserDB, 'passwordHash'>;

/**
 * User management service handling CRUD operations
 * Works with both local auth (password) and OIDC users
 */
@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(
    @Inject(DATABASE_CONNECTION) private readonly db: ReturnType<typeof drizzle>,
    private readonly passwordService: PasswordService,
    @Inject(forwardRef(() => QuotaService))
    private readonly quotaService: QuotaService,
    private readonly configService: AppConfigService
  ) {}

  async listUsers(): Promise<User[]> {
    const usersList = await this.db.select().from(users);
    return usersList.map((user) => this.toUserDto(user));
  }

  /**
   * Create a new user (signup)
   */
  async createUser(userData: CreateUserData): Promise<User> {
    // Check for existing username or email
    await this.checkIfUsernameExists(userData.username);
    if (userData.email) {
      await this.checkIfEmailExists(userData.email);
    }

    let passwordHash: string | undefined;

    // Hash password if provided (local auth)
    if (userData.password) {
      passwordHash = await this.passwordService.hashPassword(userData.password);
    } else if (userData.oidcProvider && userData.oidcSubject) {
      passwordHash = null;
    } else {
      throw new BadRequestException('Password is required');
    }

    // Determine role: first user becomes owner, others default to user
    const role = await this.getDefaultRole(userData.role);

    const newUser: NewUser = {
      username: userData.username,
      email: userData.email || null,
      passwordHash: passwordHash || null,
      role,
      oidcProvider: userData.oidcProvider || null,
      oidcSubject: userData.oidcSubject || null,
      status: UserStatus.ACTIVE,
      emailVerified: !!(userData.email && userData.oidcProvider),
    };

    return await this.db.transaction(async (tx) => {
      const [createdUser] = await this.db.insert(users).values(newUser).returning();
      await this.quotaService.createUserQuota(createdUser.id, {
        totalStorage: this.configService.getConfig().account.defaultUserStorageQuota,
      }, tx);
      return this.toUserDto(createdUser);
    });
  }

  /**
   * Find user by username or email (for login)
   */
  async findUserEntityForAuth(usernameOrEmail: string): Promise<UserDB | null> {
    const [user] = await this.db
      .select()
      .from(users)
      .where(or(eq(users.username, usernameOrEmail), eq(users.email, usernameOrEmail)))
      .limit(1);

    return user || null;
  }

  async findUserForAuth(usernameOrEmail: string): Promise<User | null> {
    const user = await this.findUserEntityForAuth(usernameOrEmail);
    return user ? this.toUserDto(user) : null;
  }

  toUserDto(user: UserDB): User {
    return UserSchema.parse(user);
  }

  /**
   * Find user by ID
   */
  async findUserById(id: string): Promise<User | null> {
    const [user] = await this.db.select().from(users).where(eq(users.id, id)).limit(1);
    return user ? UserSchema.parse(user) : null;
  }

  /**
   * Find user by OIDC provider and subject
   */
  async findUserByOIDC(provider: string, subject: string): Promise<UserDB | null> {
    const [user] = await this.db
      .select()
      .from(users)
      .where(and(eq(users.oidcProvider, provider), eq(users.oidcSubject, subject)))
      .limit(1);

    return user || null;
  }

  /**
   * Update user's last login timestamp
   */
  async updateLastLogin(userId: string): Promise<void> {
    await this.db.update(users).set({ lastLoginAt: new Date() }).where(eq(users.id, userId));
  }

  /**
   * Update user password
   */
  async updatePassword(userId: string, newPassword: string): Promise<void> {
    const passwordHash = await this.passwordService.hashPassword(newPassword);

    await this.db
      .update(users)
      .set({
        passwordHash,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));
  }

  /**
   * Check if email already exists
   */
  private async checkIfEmailExists(email: string): Promise<void> {
    const [existingUser] = await this.db
      .select({ email: users.email })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existingUser) {
      throw new ConflictException('Email already exists');
    }
  }

  /**
   * Check if username already exists
   */
  private async checkIfUsernameExists(username: string): Promise<void> {
    const [existingUser] = await this.db
      .select({ username: users.username })
      .from(users)
      .where(eq(users.username, username))
      .limit(1);

    if (existingUser) {
      throw new ConflictException('Username already exists');
    }
  }

  /**
   * Determine default role - first user becomes owner
   */
  private async getDefaultRole(defaultRole: UserRole = UserRole.USER): Promise<'user' | 'owner'> {
    const [existingUser] = await this.db.select({ id: users.id }).from(users).limit(1);

    return existingUser ? UserRole.USER : UserRole.OWNER;
  }

  /**
   * Remove sensitive fields from user object
   */
  private sanitizeUser(user: UserDB): UserWithoutSensitive {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, ...sanitized } = user;
    return sanitized;
  }

  /**
   * Verify user password
   */
  async verifyPassword(userId: string, password: string): Promise<boolean> {
    const [user] = await this.db
      .select({ passwordHash: users.passwordHash })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user?.passwordHash) {
      return false;
    }

    return this.passwordService.verifyPassword(password, user.passwordHash);
  }

  async overridePassword(
    userId: string,
    newPassword: string
  ): Promise<void> {
    if (!newPassword || newPassword.length < 8) {
      throw new BadRequestException('New password must be at least 8 characters long');
    }

    const user = await this.findUserEntityForAuth(userId);
    if (!user) {
      throw new BadRequestException(`User with ID ${userId} not found`);
    }

    const passwordHash = await this.passwordService.hashPassword(newPassword);

    await this.db
      .update(users)
      .set({
        passwordHash,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));
  }
}
