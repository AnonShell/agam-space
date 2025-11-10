import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Logger,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { FastifyRequest } from 'fastify';
import { FastifyReply } from 'fastify';

import { AuthRequired } from '../auth.decorator';
import {
  LoginResponseDto,
  LoginWithPasswordDto,
  LogoutResponseDto,
  NewUserSignupRequestDto,
  UserDto,
} from '../dto/auth.dto';
import { AuthService } from '../services/auth.service';
import { SsoService } from '@/modules/sso/sso.service';
import { createHash } from 'crypto';
import { clearAuthCookies, setAuthCookies } from '@/modules/auth/utils/cookies';
import { AgamCookies } from '@/modules/auth/auth.models';
import { UserService } from '@/modules/auth/user.service';

@ApiTags('Users')
@Controller('users')
export class UserController {
  private readonly logger = new Logger(UserController.name);

  constructor(private readonly userService: UserService) {}
}
