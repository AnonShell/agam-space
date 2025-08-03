import { Injectable, Logger } from '@nestjs/common';
import * as argon2 from 'argon2';

/**
 * Password hashing service using Argon2id with built-in salt
 * Uses standard argon2 library for password authentication (not key derivation)
 */
@Injectable()
export class PasswordService {
  private readonly logger = new Logger(PasswordService.name);
  // Argon2 options for password authentication (balance of security and performance)
  private readonly argon2Options = {
    type: argon2.argon2id,
    memoryCost: 32_768, // 32 MB (sensitive profile)
    timeCost: 3, // 3 iterations
    parallelism: 2, // 2 threads
  };

  /**
   * Hash a password using Argon2id with embedded salt
   * Returns encoded hash string that includes salt, parameters, and hash
   */
  async hashPassword(password: string): Promise<string> {
    if (!password || password.length === 0) {
      throw new Error('Password cannot be empty');
    }

    try {
      return await argon2.hash(password, this.argon2Options);
    } catch (error) {
      throw new Error(
        `Password hashing failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Verify a password against stored hash
   * The hash includes salt and parameters, so no separate salt needed
   */
  async verifyPassword(password: string, hash: string): Promise<boolean> {
    if (!password || !hash) {
      return false;
    }

    try {
      return await argon2.verify(hash, password);
    } catch (error) {
      this.logger.error(
        'Password verification failed',
        error instanceof Error ? error.stack : error
      );
      return false;
    }
  }
}
