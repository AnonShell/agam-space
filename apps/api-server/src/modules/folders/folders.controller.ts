import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';

import { AuthRequired, CurrentUser } from '../auth/auth.decorator';
import { CreateFolderDto, FolderDto, UpdateFolderDto } from './dto/folder-content.dto';
import { FoldersService } from './folders.service';
import { AuthenticatedUser } from '@/modules/auth/dto/auth.dto';
import { TrashFilesResponseDto } from '@/modules/files/dto/files.dto';
import { Folder } from '@agam-space/shared-types';

@ApiTags('Folders')
@ApiBearerAuth()
@Controller('folders')
@AuthRequired()
export class FoldersController {
  constructor(private readonly foldersService: FoldersService) {}

  @Get('/:folderId')
  @ApiOperation({ summary: 'Get folder metadata and contents' })
  @ApiResponse({
    status: 200,
    description: 'Folder details, contents and path retrieved successfully',
  })
  async getFolder(
    @Param('folderId') folderId: string,
    @CurrentUser() user: AuthenticatedUser
  ): Promise<FolderDto> {
    return this.foldersService.getFolder(user.id, folderId);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new folder' })
  @ApiResponse({
    status: 201,
    description: 'Folder created successfully',
  })
  @ApiBody({ type: CreateFolderDto })
  async createFolder(
    @Body() createFolderDto: CreateFolderDto,
    @CurrentUser() user: AuthenticatedUser
  ) {
    return this.foldersService.createFolder(user.id, createFolderDto);
  }

  @Patch('/:folderId')
  @ApiOperation({ summary: 'Patch folder data' })
  @ApiBody({ type: UpdateFolderDto })
  @ApiResponse({
    status: 200,
    description: 'Folder metadata updated successfully',
    type: FolderDto,
  })
  async patchFolder(
    @Param('folderId') folderId: string,
    @Body() patchData: UpdateFolderDto,
    @CurrentUser() user: AuthenticatedUser
  ) {
    return this.foldersService.patchFolder(user.id, folderId, patchData);
  }

  @Patch('/:folderId/trash')
  @ApiOperation({ summary: 'Move folder to trash' })
  @ApiResponse({
    status: 200,
    description: 'Folder moved to trash successfully',
  })
  async trashFolder(
    @Param('folderId') folderId: string,
    @CurrentUser() user: AuthenticatedUser
  ): Promise<void> {
    return this.foldersService.deleteFolder(user.id, folderId);
  }

  @Patch('/batch/trash')
  @ApiOperation({ summary: 'Move multiple folders to trash' })
  @ApiBody({ type: [String], description: 'Array of folder IDs to trash' })
  @ApiResponse({
    status: 200,
    description: 'Folders moved to trash successfully',
    type: TrashFilesResponseDto,
  })
  async batchTrashFolders(
    @Body() folderIds: string[],
    @CurrentUser() user: AuthenticatedUser
  ): Promise<TrashFilesResponseDto> {
    const failedIds = await this.foldersService.trashFolders(user.id, folderIds);
    return {
      failedIds: failedIds && failedIds.length > 0 ? failedIds : null,
    };
  }

  @Patch('/:folderId/restore')
  @ApiOperation({ summary: 'Restore folder from trash' })
  @ApiResponse({
    status: 200,
    description: 'Folder restored successfully',
  })
  async restoreFolder(
    @Param('folderId') folderId: string,
    @CurrentUser() user: AuthenticatedUser
  ): Promise<void> {
    return this.foldersService.restoreFolder(user.id, folderId);
  }

  @Get('/:folderId/ancestors/path')
  @ApiOperation({ summary: 'Get folder ancestors' })
  @ApiResponse({
    status: 200,
    description: 'List of ancestor folders retrieved successfully',
    type: [FolderDto],
  })
  @ApiQuery({
    name: 'depth',
    required: false,
    description: 'Depth of ancestors to retrieve',
    type: Number,
    example: 5,
  })
  async getFolderAncestors(
    @Param('folderId') folderId: string,
    @Query('depth') depth: number = 5,
    @CurrentUser() user: AuthenticatedUser
  ): Promise<Folder[]> {
    if (depth < 1 || depth > 10) {
      depth = 5;
    }

    return this.foldersService.getFolderAncestors(user.id, folderId, depth);
  }
}
