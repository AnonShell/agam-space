import { Controller, Get, HttpCode, HttpStatus, Logger } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UserDto } from '../dto/auth.dto';
import { UserService } from '@/modules/auth/user.service';
import { SwaggerApiStandardErrors } from '@/common/decorators/api-swagger-errors';
import { RequireAdmin } from '@/modules/auth/decorators/roles.decorator';

@ApiTags('Users')
@Controller('/admin/users')
export class AdminUserController {
  private readonly logger = new Logger(AdminUserController.name);

  constructor(private readonly userService: UserService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'List all users',
    description: 'Retrieve a list of all registered users in the system.',
  })
  @ApiResponse({
    status: 200,
    description: 'List of users',
    type: [UserDto],
  })
  @SwaggerApiStandardErrors()
  @RequireAdmin()
  @ApiBearerAuth()
  async listUsers(): Promise<UserDto[]> {
    return await this.userService.listUsers();
  }
}
