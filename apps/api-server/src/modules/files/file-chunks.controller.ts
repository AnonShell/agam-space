import {
  BadRequestException,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Put,
  Req,
  Res,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { FastifyReply, FastifyRequest } from 'fastify';

import { FileChunkService } from './file-chunk.service';

import { AuthRequired, CurrentUser } from '../auth/auth.decorator';
import { FilesService } from './files.service';
import { AuthenticatedUser } from '@/modules/auth/dto/auth.dto';
import { cleanupRequestStream } from '@/common/helpers/stream.utils';

@ApiTags('File Chunks')
@Controller('files/:fileId/chunks')
@AuthRequired()
@ApiBearerAuth()
export class FileChunksController {
  constructor(
    private readonly fileChunksService: FileChunkService,
    private readonly filesService: FilesService
  ) {}

  @Put(':chunkIndex')
  @HttpCode(HttpStatus.CREATED)
  async uploadChunk(
    @Param('fileId') fileId: string,
    @Param('chunkIndex') chunkIndex: number,
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: FastifyRequest
  ) {
    const checksum = req.headers['x-checksum'] as string | undefined;

    const fileDirPath = await this.filesService.ensureFileDirectory(user.id, fileId);

    await this.fileChunksService.saveFileChunkStream(
      fileDirPath,
      fileId,
      chunkIndex,
      checksum,
      req.raw
    );

    cleanupRequestStream(req.raw);
  }

  @Get('/:chunkIndex')
  @ApiOperation({ summary: 'Download chunk with index' })
  @ApiResponse({ status: 200, description: 'Raw encrypted chunk' })
  async downloadFileChunk(
    @Param('fileId') fileId: string,
    @Param('chunkIndex') chunkIndex: number,
    @CurrentUser() user: AuthenticatedUser,
    @Res() response: FastifyReply
  ): Promise<any> {
    const userId = user.id;
    // TODO: check if the chunk belongs to the user

    const file = await this.filesService.getFileEntity(userId, fileId);
    if (!file) {
      throw new BadRequestException('File not found');
    }
    if (['pending', 'deleted', 'trashed'].includes(file.status)) {
      throw new NotFoundException('File is not available for download');
    }

    response.header('accept-ranges', 'bytes');
    response.header('cache-control', 'no-cache');
    response.header('content-encoding', 'identity');
    response.header('content-type', 'application/octet-stream');

    const { stream, chunk } = await this.fileChunksService.readChunkStream(
      userId,
      fileId,
      chunkIndex
    );

    stream.on('error', err => {
      console.error('Chunk stream error:', err);
    });

    response.header('content-length', chunk.approxSize);
    response.header('x-checksum', chunk.checksum);
    return response.send(stream);
  }

  @Get('/:chunkIndex/exists')
  @ApiOperation({ summary: 'Check if chunk exists' })
  @HttpCode(HttpStatus.NO_CONTENT)
  async checkChunkExists(
    @Param('fileId') fileId: string,
    @Param('chunkIndex') chunkIndex: number,
    @CurrentUser() user: AuthenticatedUser
  ): Promise<void> {
    const userId = user.id;
    // TODO: check if the chunk belongs to the user
    const exists = await this.fileChunksService.chunkExists(fileId, chunkIndex);
    if (!exists) {
      throw new NotFoundException('Chunk not found');
    }
  }
}
