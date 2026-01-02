import { Controller, Get, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { FastifyRequest } from 'fastify';
import { SessionCryptoMaterial, SessionCryptoMaterialSchema } from '@agam-space/shared-types';

import { AuthRequired, CurrentUser } from '../auth.decorator';
import { AuthenticatedUser } from '@/modules/auth/dto/auth.dto';
import { SessionService } from '@/modules/auth/services/session.service';
import { createZodDto } from 'nestjs-zod';

class SessionCryptoMaterialDto extends createZodDto(SessionCryptoMaterialSchema) {}

@ApiTags('Session')
@ApiBearerAuth()
@AuthRequired()
@Controller('/session')
export class SessionController {
  constructor(private readonly sessionService: SessionService) {}

  @Get('/crypto-material')
  @AuthRequired()
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get session crypto material',
    description: 'Get encryption nonce for client-side operations. Rotates every 15 minutes.',
  })
  @ApiResponse({
    status: 200,
    description: 'Session crypto material retrieved successfully',
    type: SessionCryptoMaterialDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Not authenticated',
  })
  async getSessionCryptoMaterial(
    @CurrentUser() user: AuthenticatedUser,
    @Req() request: FastifyRequest
  ): Promise<SessionCryptoMaterial> {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return await this.sessionService.getOrCreateEncryptionNonce(request.sessionId!);
  }
}
