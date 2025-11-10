import { Controller, Get, Param } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';

import { AuthRequired, CurrentUser } from '../auth/auth.decorator';
import { FolderContentsDto, isRootFolder } from './dto/folder-content.dto';
import { FolderContentService } from './folder-content.service';
import { AuthenticatedUser } from '@/modules/auth/dto/auth.dto';
import { SwaggerApiStandardErrors } from '@/common/decorators/api-swagger-errors';

@ApiTags('Folders')
@ApiBearerAuth()
@Controller('folders/:folderId/contents')
@AuthRequired()
export class FolderContentController {
  constructor(private readonly contentService: FolderContentService) {}

  @Get()
  @ApiOperation({ summary: 'Get folder metadata and contents' })
  @ApiResponse({
    status: 200,
    description: 'Folder details, contents and path retrieved successfully',
    type: FolderContentsDto,
  })
  @ApiParam({ name: 'folderId', description: 'Folder ID' })
  @ApiResponse({ status: 404, description: 'Folder not found' })
  @SwaggerApiStandardErrors()
  async getFolder(
    @Param('folderId') folderId: string,
    @CurrentUser() user: AuthenticatedUser
  ): Promise<FolderContentsDto> {
    return this.contentService.getContents(user.id, isRootFolder(folderId) ? null : folderId);
  }
}
