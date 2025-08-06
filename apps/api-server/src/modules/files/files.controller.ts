import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Request,
} from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';

import { AuthRequired, CurrentUser } from '../auth/auth.decorator';
import { CheckFileExistsDto, CreateFileDto, TrashFilesResponseDto, UpdateFileDto } from './dto/files.dto';
import { FilesService } from './files.service';
import { FileUploadStatusDto } from '@/modules/files/dto/upload.dto';
import { AuthenticatedUser } from '@/modules/auth/dto/auth.dto';
import { File } from '@agam-space/shared-types';
import { FileDto } from '@/modules/folders/dto/folder-content.dto';

@ApiBearerAuth()
@ApiTags('Files')
@Controller('files')
@AuthRequired()
export class FilesController {
  constructor(private readonly filesService: FilesService) {}
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new file' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'File created successfully',
    type: FileDto,
  })
  async createFile(
    @CurrentUser() user: AuthenticatedUser,
    @Body() createFileDto: CreateFileDto
  ): Promise<FileDto> {
    return this.filesService.createFile(user.id, createFileDto);
  }

  @Put(':fileId/complete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Complete file upload' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'File upload completed' })
  async completeFileUpload(
    @CurrentUser() user: AuthenticatedUser,
    @Param('fileId') fileId: string
  ): Promise<FileDto> {
    return this.filesService.markFileAsComplete(user.id, fileId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get file by ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'File retrieved successfully',
    type: FileDto,
  })
  async getFile(@Request() req: any, @Param('id') id: string): Promise<FileDto> {
    return this.filesService.getFile(req.user.id, id);
  }

  @Patch(':fileId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update file data' })
  @ApiBody({ type: UpdateFileDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'File metadata updated successfully',
    type: FileDto,
  })
  async updateFile(
    @CurrentUser() user: AuthenticatedUser,
    @Param('fileId') fileId: string,
    @Body() updateData: UpdateFileDto
  ): Promise<File> {
    return this.filesService.updateFile(user.id, fileId, updateData);
  }

  @Patch(':id/trash')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark file as trashed' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'File marked as trashed successfully',
  })
  async trashFile(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string): Promise<void> {
    await this.filesService.trashFile(user.id, id);
  }

  // batch trash files
  @Patch('batch/trash')
  @HttpCode(HttpStatus.OK)
  @ApiBody({ type: [String], description: 'Array of file IDs to be trashed' })
  @ApiOperation({ summary: 'Batch mark files as trashed' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Files marked as trashed successfully',
    type: TrashFilesResponseDto,
  })
  async batchTrashFiles(
    @CurrentUser() user: AuthenticatedUser,
    @Body('fileIds') fileIds: string[]
  ): Promise<TrashFilesResponseDto> {
    const failedIds = await this.filesService.trashFiles(user.id, fileIds);
    return {
      failedIds: failedIds && failedIds.length > 0 ? failedIds : undefined,
    };
  }

  // delete file permanently
  @Delete(':fileId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete file permanently' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'File deleted permanently successfully ',
  })
  async deleteFile(
    @CurrentUser() user: AuthenticatedUser,
    @Param('fileId') fileId: string,
    @Query('force') force: boolean = false
  ): Promise<void> {
    await this.filesService.deleteFile(user.id, fileId, force);
  }

  @Patch(':id/restore')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Restore trashed file' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'File restored successfully',
  })
  async restoreFile(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string
  ): Promise<void> {
    await this.filesService.restoreFile(user.id, id);
  }

  @Get(':id/upload/status')
  @ApiOperation({ summary: 'Get file upload status' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'File upload status retrieved successfully',
    type: FileUploadStatusDto,
  })
  async getFileUploadStatus(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string
  ): Promise<FileUploadStatusDto> {
    return this.filesService.fileUploadStatus(user.id, id);
  }

  // check if file nameHash exists in selected folder
  @Get('/exists/name-hash')
  @ApiOperation({ summary: 'Check if file nameHash exists in folder' })
  @ApiQuery({ name: 'nameHash', type: String, required: true })
  @ApiQuery({ name: 'parentId', type: String, required: false })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'File nameHash existence checked successfully',
    type: Boolean,
  })
  async checkFileNameHashExists(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: CheckFileExistsDto,
  ): Promise<{
    exists: boolean;
    id: string | null;
  }> {
    const exitingId = await this.filesService.checkFileNameHashExists(user.id, query.parentId, query.nameHash);
    return {
      exists: !!exitingId,
      id: exitingId || null,
    }
  }
}
