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
import { FastifyReply, FastifyRequest } from 'fastify';
import { Throttle, ThrottlerGuard, SkipThrottle } from '@nestjs/throttler';
import {
  ChangeLoginPasswordRequestDto,
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
import { AuthRequired, CurrentUser } from '../auth.decorator';
import { AuthenticatedUser } from '@/modules/auth/dto/auth.dto';

@ApiTags('Authentication')
@Controller('auth')
@UseGuards(ThrottlerGuard)
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(
    private readonly authService: AuthService,
    private readonly ssoService: SsoService
  ) {}

  @Post('signup')
  @HttpCode(HttpStatus.CREATED)
  @Throttle({ default: { ttl: 3600_000, limit: 10 } })
  @ApiOperation({
    summary: 'User signup',
    description: 'Create a new user account. Login separately to get session token.',
  })
  @ApiBody({ type: NewUserSignupRequestDto })
  @ApiResponse({
    status: 201,
    description: 'User created successfully',
    type: UserDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input or username/email already exists',
  })
  async signup(@Body() signupDto: NewUserSignupRequestDto): Promise<UserDto> {
    this.logger.log(`Signup attempt for username: ${signupDto.username}`);

    const user = await this.authService.signup({
      username: signupDto.username,
      password: signupDto.password,
      email: signupDto.email,
    });

    this.logger.log(`Signup successful for user: ${user.username}`);
    return user;
  }

  @Post('login/password')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { ttl: 900_000, limit: 15 } })
  @ApiOperation({
    summary: 'User login',
    description: 'Authenticate user credentials and return session token',
  })
  @ApiBody({ type: LoginWithPasswordDto })
  @ApiResponse({
    status: 200,
    description: 'Login successful',
    type: LoginResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid credentials',
  })
  async login(
    @Body() loginDto: LoginWithPasswordDto,
    @Req() request: FastifyRequest,
    @Res() res: FastifyReply
  ): Promise<LoginResponseDto> {
    this.logger.log(`Login attempt for: ${loginDto.username}`);

    const userAgent = request.headers['user-agent'];
    const ipAddress = request.ip;

    const result = await this.authService.login({
      username: loginDto.username,
      password: loginDto.password,
      userAgent,
      ipAddress,
    });

    setAuthCookies(res, result.session.token, request.protocol === 'https');

    this.logger.log(`Login successful for user: ${result.user.username}`);
    return res.send(result);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @SkipThrottle()
  @ApiOperation({
    summary: 'User logout',
    description: 'Logout from current session and invalidate token',
  })
  @ApiResponse({
    status: 200,
    description: 'Logout successful',
    type: LogoutResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Not authenticated',
  })
  async logout(
    @Req() request: FastifyRequest,
    @Res() res: FastifyReply
  ): Promise<LogoutResponseDto> {
    const sessionToken = request.cookies?.[AgamCookies.ACCESS_TOKEN];

    const success = await this.authService.logout(sessionToken);
    this.logger.log(
      `Logout ${success ? 'successful' : 'failed'} for session: ${sessionToken.slice(0, 3)}...`
    );

    clearAuthCookies(res);
    return res.send({
      success,
    });
  }

  @Get('/sso/oidc')
  @SkipThrottle()
  async startOidc(@Query('client') clientType: string = 'browser', @Res() res: FastifyReply) {
    if (!this.ssoService.isEnabled()) return res.status(404).send();

    const statePayload = { client: clientType };
    const state = Buffer.from(JSON.stringify(statePayload)).toString('base64url');

    const verifier = this.ssoService.generateVerifier(state);
    const challenge = createHash('sha256').update(verifier).digest().toString('base64url');

    const url = this.ssoService.getAuthorizationUrl(challenge, state);
    return res.status(302).header('location', url).send();
  }

  @Get('/sso/oidc/callback')
  @SkipThrottle()
  async callback(@Req() req: FastifyRequest, @Res() res: FastifyReply) {
    if (!this.ssoService.isEnabled()) return res.status(404).send();

    const { code, state: rawState } = req.query as {
      code: string;
      state: string;
    };

    const state = JSON.parse(Buffer.from(rawState, 'base64url').toString());
    const verifier = this.ssoService.consumeVerifier(rawState);
    if (!verifier) return res.status(400).send('Missing verifier');

    const userInfo = await this.ssoService.exchangeCode(code, verifier);

    const userAgent = req.headers['user-agent'];
    const ipAddress = req.ip;

    const loginResponse = await this.authService.authSSO(userInfo, {
      userAgent,
      ipAddress,
    });

    if (state.client === 'browser') {
      setAuthCookies(res, loginResponse.session.token, req.protocol === 'https');
      return res.status(302).header('location', '/').send();
    }

    // Default fallback
    this.logger.warn(`Unknown client type in SSO state: ${state.client}`);
    return res.status(400).send('Unknown client type');
  }

  @Post('change-login-password')
  @HttpCode(HttpStatus.OK)
  @AuthRequired()
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Change login password',
    description: 'Change login password for non-SSO users.',
  })
  @ApiBody({ type: ChangeLoginPasswordRequestDto })
  @Post('change-login-password')
  @HttpCode(HttpStatus.NO_CONTENT)
  @AuthRequired()
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Change login password',
    description:
      'Change login password for non-SSO users. This is separate from your master password used for encryption. Requires cryptographic challenge verification (signed with identity key) to prevent unauthorized changes even if session is compromised. SSO users cannot change login password as it is managed by their identity provider.',
  })
  @ApiBody({ type: ChangeLoginPasswordRequestDto })
  @ApiResponse({
    status: 204,
    description: 'Login password changed successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Current login password is incorrect',
  })
  @ApiResponse({
    status: 403,
    description: 'SSO users cannot change login password',
  })
  async changeLoginPassword(
    @CurrentUser() user: AuthenticatedUser,
    @Body() changeLoginPasswordDto: ChangeLoginPasswordRequestDto
  ): Promise<void> {
    await this.authService.changeLoginPassword(user.id, changeLoginPasswordDto);
  }
}
