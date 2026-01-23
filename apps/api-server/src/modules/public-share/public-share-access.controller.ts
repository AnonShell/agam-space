import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Post,
  Query,
  Res,
} from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { PublicShareService } from './public-share.service';
import {
  GetPublicShareKeyDetailsDto,
  PublicShareExternalDetailsDto,
  PublicShareKeysDto,
} from './dto/public-share.dto';
import { PublicShareContentResponseDto } from './dto/public-share-content.dto';
import { PublicShareExternalDetailsSchema } from '@agam-space/shared-types';
import { PublicShareAccessRequired, ValidatedShareId } from './public-share-access.decorator';
import type { FastifyReply } from 'fastify';
import { sendChunkStream } from '@/common/helpers/response.utils';

/**
 * Public access controller - no authentication required
 * Used by recipients to access shared content
 */
@ApiTags('Public Share Access')
@Controller('public/share')
export class PublicShareAccessController {
  constructor(private readonly publicShareService: PublicShareService) {}

  @Get(':id')
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  @ApiOperation({ summary: 'Get public share metadata (no auth required)' })
  @ApiResponse({
    status: 200,
    description: 'Public share metadata retrieved successfully',
    type: PublicShareExternalDetailsDto,
  })
  async getShareMetadata(@Param('id') id: string): Promise<PublicShareExternalDetailsDto> {
    const share = await this.publicShareService.getShareEntityById(id);
    if (!share) {
      throw new NotFoundException('Share not found');
    }
    return PublicShareExternalDetailsSchema.parse({
      ...share,
      requiredPassword: !!share.passwordHash,
    });
  }

  @Post(':id/keys')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @ApiOperation({ summary: 'Get share keys with optional password validation (no auth required)' })
  @ApiResponse({ status: 200, description: 'Share key details returned', type: PublicShareKeysDto })
  @ApiBody({ type: GetPublicShareKeyDetailsDto })
  @HttpCode(HttpStatus.OK)
  async getShareKeys(
    @Param('id') id: string,
    @Body() body: GetPublicShareKeyDetailsDto
  ): Promise<PublicShareKeysDto> {
    return await this.publicShareService.getShareKeyDetails(id, body.password);
  }

  @Get(':id/content')
  @Throttle({ default: { limit: 100, ttl: 60_000 } })
  @PublicShareAccessRequired()
  @ApiOperation({ summary: 'Get share content (root or specific folder)' })
  @ApiResponse({
    status: 200,
    description: 'Share content retrieved successfully',
    type: PublicShareContentResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Share or folder not found' })
  async getShareContent(
    @ValidatedShareId() shareId: string,
    @Query('folderId') folderId?: string
  ): Promise<PublicShareContentResponseDto> {
    return await this.publicShareService.getShareContent(shareId, folderId);
  }

  @Get(':id/files/:fileId/chunks/:chunkIndex')
  @Throttle({ default: { limit: 100, ttl: 60_000 } })
  @PublicShareAccessRequired()
  @ApiOperation({ summary: 'Download chunk with index' })
  @ApiResponse({ status: 200, description: 'Raw encrypted chunk' })
  async getFileChunk(
    @ValidatedShareId() shareId: string,
    @Param('fileId') fileId: string,
    @Param('chunkIndex') chunkIndex: number,
    @Res() response: FastifyReply
  ): Promise<void> {
    const { stream, chunk } = await this.publicShareService.getFileChunk(
      shareId,
      fileId,
      chunkIndex
    );

    await sendChunkStream(response, stream, chunk);
  }
}
