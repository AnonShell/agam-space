import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { FastifyRequest } from 'fastify';

import { AuthService } from './services/auth.service';
import { AuthenticatedUser } from '@/modules/auth/dto/auth.dto';
import { AgamCookies } from '@/modules/auth/auth.models';

// Extend FastifyRequest to include user context
declare module 'fastify' {
  interface FastifyRequest {
    user?: AuthenticatedUser;
    sessionId?: string;
  }
}

/**
 * Authentication guard for protecting routes
 * Validates session tokens and injects user context into requests
 */
@Injectable()
export class AuthGuard implements CanActivate {
  private readonly logger = new Logger(AuthGuard.name);

  constructor(private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<FastifyRequest>();

    const token = this.extractTokenFromRequest(request);
    if (!token) {
      throw new UnauthorizedException('No authentication token provided');
    }

    try {
      const sessionContext = await this.authService.validateSession(token);
      if (!sessionContext) {
        throw new UnauthorizedException('Invalid or expired session');
      }

      request.user = sessionContext.user;
      request.sessionId = sessionContext.sessionId;
      return true;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }

      this.logger.error('Authentication error:', error);
      throw new UnauthorizedException('Authentication failed');
    }
  }

  private extractTokenFromRequest(request: FastifyRequest): string | null {
    // Try Authorization header first: "Bearer <token>"
    const authHeader = request.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.slice(7);
    }

    const cookie = request.cookies?.[AgamCookies.ACCESS_TOKEN];
    if (cookie) {
      return cookie;
    }

    return null;
  }
}
