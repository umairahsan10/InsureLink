import {
  Controller,
  Post,
  Get,
  Body,
  BadRequestException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { TokenResponseDto } from './dto/token-response.dto';
import { Auth } from './decorators/auth.decorator';
import { Public } from './decorators/public.decorator';
import { CurrentUser } from './decorators/current-user.decorator';
import { CurrentUserDto } from './dto/current-user.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * POST /auth/login
   */
  @Public()
  @Post('login')
  async login(@Body() loginDto: LoginDto): Promise<TokenResponseDto> {
    return this.authService.login(loginDto);
  }

  /**
   * POST /auth/register
   */
  @Public()
  @Post('register')
  async register(@Body() registerDto: RegisterDto): Promise<TokenResponseDto> {
    return this.authService.register(registerDto);
  }

  /**
   * POST /auth/refresh-token
   */
  @Public()
  @Post('refresh-token')
  async refreshToken(@Body() body: { refresh_token: string }): Promise<TokenResponseDto> {
    if (!body.refresh_token) {
      throw new BadRequestException('refresh_token is required');
    }
    return this.authService.refreshToken(body.refresh_token);
  }

  /**
   * GET /auth/me
   */
  @Auth()
  @Get('me')
  async me(@CurrentUser() user: CurrentUserDto) {
    return this.authService.getCurrentUser(user.id);
  }
}


