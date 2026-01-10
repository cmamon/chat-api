import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import * as argon2 from 'argon2';
import { randomBytes } from 'crypto';
import { RedisService } from '../redis/redis.service';
import { Logger } from '@app/logger';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly redisService: RedisService,
    private readonly logger: Logger,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    try {
      const user = await this.usersService.findByEmail(email);

      if (!user) {
        // Timing attack protection
        await argon2.verify('$argon2id$v=19$m=65536,t=3,p=4$dummy', 'dummy');
        throw new UnauthorizedException('Invalid credentials');
      }

      if (!user.isActive) {
        throw new UnauthorizedException('Account is inactive');
      }

      const isPasswordValid = await argon2.verify(user.password, password);

      if (!isPasswordValid) {
        throw new UnauthorizedException('Invalid credentials');
      }

      const { password: _, ...result } = user;
      return result;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      this.logger.error(`Error during user validation: ${error.message}`);
      throw new UnauthorizedException('Invalid credentials');
    }
  }

  async login(user: any, metadata?: { deviceId?: string; ipAddress?: string; userAgent?: string }) {
    const accessToken = await this.generateAccessToken(user);
    const refreshToken = await this.generateRefreshToken(user, metadata);

    await this.usersService.updateLastLogin(user.id);

    return {
      accessToken,
      refreshToken,
      expiresIn: 900,
      tokenType: 'Bearer',
    };
  }

  async refreshAccessToken(refreshToken: string, userId: string) {
    const redisKey = `refresh_token:${userId}:${refreshToken}`;
    const tokenData = await this.redisService.get(redisKey);

    if (!tokenData) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const metadata = JSON.parse(tokenData);

    if (metadata.expiresAt && new Date() > new Date(metadata.expiresAt)) {
      await this.redisService.del(redisKey);
      throw new UnauthorizedException('Refresh token expired');
    }

    const user = await this.usersService.findById(userId);
    if (!user || !user.isActive) {
      throw new UnauthorizedException('User not found or inactive');
    }

    const accessToken = await this.generateAccessToken(user);

    return {
      accessToken,
      expiresIn: 900,
      tokenType: 'Bearer',
    };
  }

  async logout(refreshToken: string, userId: string) {
    const redisKey = `refresh_token:${userId}:${refreshToken}`;
    await this.redisService.del(redisKey);
    return { message: 'Logged out successfully' };
  }

  async logoutAllDevices(userId: string) {
    const pattern = `refresh_token:${userId}:*`;
    const keys = await this.redisService.keys(pattern);

    if (keys.length > 0) {
      await this.redisService.del(...keys);
    }

    return { message: 'Logged out from all devices' };
  }

  async getActiveSessions(userId: string) {
    const pattern = `refresh_token:${userId}:*`;
    const keys = await this.redisService.keys(pattern);

    const sessions: any[] = [];
    for (const key of keys) {
      const data = await this.redisService.get(key);
      if (data) {
        const metadata = JSON.parse(data);
        sessions.push({
          ...metadata,
          token: metadata.token.substring(0, 10) + '...', // Mask token
        });
      }
    }

    return sessions;
  }

  private async enforceMaxSessions(userId: string) {
    const pattern = `refresh_token:${userId}:*`;
    const keys = await this.redisService.keys(pattern);

    if (keys.length >= 5) {
      // 5 sessions max
      const sessions: any[] = [];
      for (const key of keys) {
        const data = await this.redisService.get(key);
        if (data) {
          sessions.push({ key, data: JSON.parse(data) });
        }
      }

      sessions.sort((a, b) => new Date(a.data.createdAt).getTime() - new Date(b.data.createdAt).getTime());

      if (sessions.length > 0) {
        await this.redisService.del(sessions[0].key);
        this.logger.log(`Removed oldest session for user ${userId}`);
      }
    }
  }

  private async generateAccessToken(user: any): Promise<string> {
    return this.jwtService.sign(
      {
        sub: user.id,
        email: user.email,
        type: 'access',
      },
      {
        expiresIn: '15m',
      },
    );
  }

  private async generateRefreshToken(
    user: any,
    metadata?: { deviceId?: string; ipAddress?: string; userAgent?: string },
  ): Promise<string> {
    const token = randomBytes(64).toString('base64url');
    const redisKey = `refresh_token:${user.id}:${token}`;

    await this.redisService.setex(
      redisKey,
      7 * 24 * 60 * 60,
      JSON.stringify({
        token,
        userId: user.id,
        deviceId: metadata?.deviceId,
        ipAddress: metadata?.ipAddress,
        userAgent: metadata?.userAgent,
        createdAt: new Date(),
      }),
    );

    await this.enforceMaxSessions(user.id);

    return token;
  }

  async hashPassword(password: string): Promise<string> {
    return argon2.hash(password, {
      type: argon2.argon2id,
      memoryCost: 65536,
      timeCost: 3,
      parallelism: 4,
    });
  }

  validatePasswordStrength(password: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (password.length < 12) {
      errors.push('Password must be at least 12 characters long');
    }
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    if (!/[0-9]/.test(password)) {
      errors.push('Password must contain at least one number');
    }
    if (!/[^A-Za-z0-9]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
