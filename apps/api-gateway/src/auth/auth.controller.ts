import {
  Controller,
  Post,
  Body,
  UseGuards,
  Req,
  Get,
  HttpCode,
  HttpStatus,
  Ip,
  Headers,
  BadRequestException,
  Query,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ThrottlerGuard } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { Public } from './decorators/public.decorator';
import { CurrentUser } from './decorators/current-user.decorator';
import { LoginDto, RegisterDto, RefreshTokenDto } from './dto';
import { UsersService } from '../users/users.service';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) {}

  @Public()
  @UseGuards(AuthGuard('local'), ThrottlerGuard)
  @HttpCode(HttpStatus.OK)
  @Post('login')
  async login(@Body() loginDto: LoginDto, @Req() req: any, @Ip() ip: string, @Headers('user-agent') userAgent: string) {
    return this.authService.login(req.user, {
      ipAddress: ip,
      userAgent,
      deviceId: loginDto.deviceId,
    });
  }

  @Public()
  @UseGuards(ThrottlerGuard)
  @Post('register')
  async register(@Body() registerDto: RegisterDto, @Ip() ip: string, @Headers('user-agent') userAgent: string) {
    const validation = this.authService.validatePasswordStrength(registerDto.password);
    if (!validation.valid) {
      throw new BadRequestException({
        message: 'Password does not meet requirements',
        errors: validation.errors,
      });
    }

    const { email, username, password } = registerDto;

    // Check if user already exists
    const existingUser = await this.usersService.findByEmail(email);
    if (existingUser) {
      throw new BadRequestException('User already exists');
    }

    const hashedPassword = await this.authService.hashPassword(password);

    const user = await this.usersService.create({
      email,
      username,
      password: hashedPassword,
    });

    return this.authService.login(user, {
      ipAddress: ip,
      userAgent,
      deviceId: registerDto.deviceId,
    });
  }

  @Public()
  @UseGuards(AuthGuard('jwt-refresh'))
  @HttpCode(HttpStatus.OK)
  @Post('refresh')
  async refresh(@Body() refreshTokenDto: RefreshTokenDto, @CurrentUser() user: any) {
    return this.authService.refreshAccessToken(user.refreshToken, user.userId);
  }

  @Public()
  @Get('verify-email')
  async verifyEmail(@Query('token') token: string) {
    return this.authService.verifyEmail(token);
  }

  @Public()
  @Post('resend-verification')
  async resendVerification(@Body() body: { email: string }) {
    const user = await this.usersService.findByEmail(body.email);
    if (!user) {
      return { message: 'Verification email sent if account exists' };
    }
    return this.authService.sendVerificationEmail(user.id, user.email);
  }

  @HttpCode(HttpStatus.OK)
  @Post('logout')
  async logout(@Body() body: { refreshToken: string }, @CurrentUser('userId') userId: string) {
    return this.authService.logout(body.refreshToken, userId);
  }

  @HttpCode(HttpStatus.OK)
  @Post('logout-all')
  async logoutAll(@CurrentUser('userId') userId: string) {
    return this.authService.logoutAllDevices(userId);
  }

  @Get('sessions')
  async getSessions(@CurrentUser('userId') userId: string) {
    return this.authService.getActiveSessions(userId);
  }

  @Get('me')
  async getProfile(@CurrentUser() user: any) {
    return user;
  }
}
