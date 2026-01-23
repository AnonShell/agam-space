import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { FastifyRequest } from 'fastify';
import { PublicShareService } from './public-share.service';

declare module 'fastify' {
  interface FastifyRequest {
    shareId?: string;
  }
}

/**
 * Guard for validating public share access tokens
 */
@Injectable()
export class PublicShareAccessGuard implements CanActivate {
  private readonly logger = new Logger(PublicShareAccessGuard.name);

  constructor(private readonly publicShareService: PublicShareService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<FastifyRequest>();

    const token = this.extractTokenFromRequest(request);
    if (!token) {
      throw new UnauthorizedException('Access token required');
    }

    try {
      const validatedShareId = await this.publicShareService.validateAccessToken(token);

      const routeShareId = request.params?.['id'];

      if (routeShareId && validatedShareId !== routeShareId) {
        throw new UnauthorizedException('Invalid access token for this share');
      }

      request.shareId = validatedShareId;
      return true;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }

      this.logger.error('Public share access validation error:', error);
      throw new UnauthorizedException('Invalid or expired access token');
    }
  }

  private extractTokenFromRequest(request: FastifyRequest): string | null {
    const authHeader = request.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.slice(7);
    }

    return null;
  }
}
