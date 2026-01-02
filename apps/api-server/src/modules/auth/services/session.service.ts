import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { Cache } from 'cache-manager';
import { createHash } from 'crypto';
import { and, eq, sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';

import { AppConfigService } from '../../../config/config.service';
import { DATABASE_CONNECTION } from '../../../database/database.providers';
import { type NewUserSession, type UserSession, userSessions } from '../../../database/schema';
import { randomBytes } from 'node:crypto';
import type { SessionCryptoMaterial } from '@agam-space/shared-types';

export interface CreateSessionData {
  userId: string;
  deviceFingerprint?: string;
  userAgent?: string;
  ipAddress?: string;
  expiresInMs?: number; // Default: from config
}

/**
 * Session management service for authentication tokens
 * Handles session lifecycle: create, validate, refresh, cleanup
 */
@Injectable()
export class SessionService {
  private readonly logger = new Logger(SessionService.name);

  // Lazy update threshold: 5 minutes
  private readonly LAZY_UPDATE_THRESHOLD_MS = 5 * 60 * 1000;

  // Session encryption nonce TTL: 15 minutes
  private readonly SESSION_ENC_NONCE_TTL_MS = 15 * 60 * 1000;

  constructor(
    @Inject(DATABASE_CONNECTION) private readonly db: ReturnType<typeof drizzle>,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    private readonly configService: AppConfigService
  ) {}

  private hashToken(token: string): string {
    return createHash('sha256').update(token, 'utf8').digest('base64');
  }

  /**
   * Parse time string (e.g., "7d", "24h", "30m") to milliseconds
   */
  private parseTimeToMs(timeStr: string): number {
    const match = timeStr.match(/^(\d+)([dhm])$/);
    if (!match) {
      throw new Error(`Invalid time format: ${timeStr}. Use format like "7d", "24h", "30m"`);
    }

    const [, value, unit] = match;
    const num = parseInt(value, 10);

    switch (unit) {
      case 'd':
        return num * 24 * 60 * 60 * 1000; // days
      case 'h':
        return num * 60 * 60 * 1000; // hours
      case 'm':
        return num * 60 * 1000; // minutes
      default:
        throw new Error(`Unknown time unit: ${unit}`);
    }
  }

  private getCacheKey(tokenHash: string): string {
    return `session:${tokenHash}`;
  }

  private getEncNonceCacheKey(sessionId: string): string {
    return `session-enc-nonce:${sessionId}`;
  }

  /**
   * Should we update the last_used_at timestamp?
   * Only update if it's been more than 5 minutes since last update
   */
  private shouldUpdateLastUsed(session: UserSession): boolean {
    const now = Date.now();
    const lastUsedAge = now - session.lastUsedAt.getTime();
    return lastUsedAge > this.LAZY_UPDATE_THRESHOLD_MS;
  }

  /**
   * Create a new session for user
   * Returns the raw token (never stored) for client use
   */
  async createSession(
    data: CreateSessionData
  ): Promise<{ session: UserSession; rawToken: string }> {
    const sessionTimeout = this.configService.getSecurity().sessionTimeout;
    const sessionDurationMs = data.expiresInMs || this.parseTimeToMs(sessionTimeout);
    const expiresAt = new Date(Date.now() + sessionDurationMs);

    const rawToken = randomBytes(32).toString('base64url');
    const tokenHash = this.hashToken(rawToken);

    const newSession: NewUserSession = {
      tokenHash: tokenHash,
      userId: data.userId,
      deviceFingerprint: data.deviceFingerprint || null,
      userAgent: data.userAgent || null,
      ipAddress: data.ipAddress || null,
      expiresAt,
    };

    const [session] = await this.db.insert(userSessions).values(newSession).returning();

    this.logger.log(
      `Session created for user ${data.userId}: ${session.id} (token hash: ${tokenHash.slice(0, 16)}...)`
    );

    await this.cacheManager.set(this.getCacheKey(tokenHash), session);

    return { session, rawToken };
  }

  async findActiveSession(rawToken: string): Promise<UserSession | null> {
    const tokenHash = this.hashToken(rawToken);
    const cacheKey = this.getCacheKey(tokenHash);

    const cached = await this.cacheManager.get<UserSession>(cacheKey);
    if (cached) {
      if (cached.expiresAt.getTime() > Date.now()) {
        // Lazy update last_used_at if needed (async, non-blocking)
        if (this.shouldUpdateLastUsed(cached)) {
          this.updateLastUsedAsync(cached.id, tokenHash).catch(error =>
            this.logger.error(`Failed to update last_used_at:`, error)
          );
        }

        return cached;
      } else {
        await this.cacheManager.del(cacheKey);
        await this.cacheManager.del(this.getEncNonceCacheKey(cached.id));
      }
    }

    this.logger.debug(`Cache miss for session: ${tokenHash.slice(0, 16)}...`);

    const [session] = await this.db
      .select()
      .from(userSessions)
      .where(and(eq(userSessions.tokenHash, tokenHash), sql`${userSessions.expiresAt} > NOW()`))
      .limit(1);

    if (!session) {
      return null;
    }

    await this.cacheManager.set(cacheKey, session);

    // Lazy update last_used_at if needed (async, non-blocking)
    if (this.shouldUpdateLastUsed(session)) {
      this.updateLastUsedAsync(session.id, tokenHash).catch(error =>
        this.logger.error(`Failed to update last_used_at:`, error)
      );
    }

    return session;
  }

  /**
   * Update session's last used timestamp (async, non-blocking)
   */
  private async updateLastUsedAsync(sessionId: string, tokenHash: string): Promise<void> {
    const now = new Date();

    await this.db
      .update(userSessions)
      .set({ lastUsedAt: now })
      .where(eq(userSessions.id, sessionId));

    const cacheKey = this.getCacheKey(tokenHash);
    const cached = await this.cacheManager.get<UserSession>(cacheKey);
    if (cached) {
      cached.lastUsedAt = now;
      await this.cacheManager.set(cacheKey, cached);
    }

    this.logger.debug(`Updated last_used_at for session: ${sessionId}`);
  }

  /**
   * Update session's last used timestamp (synchronous, for backwards compatibility)
   */
  async updateLastUsed(sessionId: string): Promise<void> {
    await this.db
      .update(userSessions)
      .set({ lastUsedAt: new Date() })
      .where(eq(userSessions.id, sessionId));
  }

  async deleteSession(sessionId: string): Promise<boolean> {
    await this.cacheManager.del(this.getCacheKey(sessionId));
    await this.cacheManager.del(this.getEncNonceCacheKey(sessionId));

    const result = await this.db
      .delete(userSessions)
      .where(eq(userSessions.id, sessionId))
      .returning({ id: userSessions.id });

    if (result.length > 0) {
      this.logger.log(`Session deleted: ${sessionId}...`);
      return true;
    }

    return false;
  }

  async cleanupExpiredSessions(): Promise<number> {
    const result = await this.db.delete(userSessions).where(sql`${userSessions.expiresAt} < NOW()`);

    const deletedCount = result.length;

    if (deletedCount > 0) {
      this.logger.log(`Cleaned up ${deletedCount} expired sessions`);
      // Note: Cache entries will expire naturally due to TTL, maybe in future we can track and delete them here as well
    }

    return deletedCount;
  }

  /**
   * Get or create encryption nonce for session-based CMK encryption
   * Returns random nonce that rotates every 15 minutes
   */
  async getOrCreateEncryptionNonce(sessionId: string): Promise<SessionCryptoMaterial> {
    const cacheKey = this.getEncNonceCacheKey(sessionId);

    const cached = await this.cacheManager.get<SessionCryptoMaterial>(cacheKey);

    if (cached && cached.expiresAt > Date.now()) {
      return { ...cached, isNew: false };
    }

    const nonce = randomBytes(32).toString('base64');
    const expiresAt = Date.now() + this.SESSION_ENC_NONCE_TTL_MS;

    const material: SessionCryptoMaterial = {
      nonce,
      expiresAt,
      isNew: true,
    };

    await this.cacheManager.set(cacheKey, material, this.SESSION_ENC_NONCE_TTL_MS);

    this.logger.debug(`Generated new encryption nonce for session ${sessionId}`);

    return material;
  }
}
