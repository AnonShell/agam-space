import { Controller, Delete, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthRequired, CurrentUser } from '@/modules/auth/auth.decorator';
import { AuthenticatedUser } from '@/modules/auth/dto/auth.dto';
import { TrashService } from './trash.service';
import { EmptyTrashResponseDto, TrashedItemsDto } from '@/modules/trash/trash.types';
import { TrashedItems } from '@agam-space/shared-types';

@ApiTags('Trash')
@ApiBearerAuth()
@AuthRequired()
@Controller('trash')
export class TrashController {
  constructor(private readonly trashService: TrashService) {}

  @Delete('/empty')
  @ApiOperation({ summary: 'Empty the trash by deleting specified folders' })
  @ApiResponse({
    status: 200,
    description: 'Trash emptied successfully',
    type: EmptyTrashResponseDto,
  })
  async emptyTrash(@CurrentUser() user: AuthenticatedUser): Promise<EmptyTrashResponseDto> {
    const deleted = await this.trashService.emptyTrash(user.id);
    return { deletedCount: deleted };
  }

  @Get('/items')
  @ApiOperation({ summary: 'Get all items in the trash' })
  @ApiResponse({
    status: 200,
    description: 'List of items in the trash',
    type: TrashedItemsDto,
  })
  async getTrashItems(@CurrentUser() user: AuthenticatedUser): Promise<TrashedItems> {
    return this.trashService.getTrashedItems(user.id);
  }
}
