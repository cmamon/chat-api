import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import * as argon2 from 'argon2';
import { randomBytes } from 'crypto';
import { RedisService } from '@app/redis';
import { Logger } from '@app/logger';
import {
    TokenPayload,
    AuthResponse,
    LoginMetadata,
    RefreshTokenMetadata,
} from './interfaces/auth.interface';

@Injectable()
export class AuthService {
    private readonly FAILED_LOGIN_PREFIX = 'failed_login:';
    private readonly BLOCKED_PREFIX = 'blocked:';
    private readonly MAX_LOGIN_ATTEMPTS = 5;
    private readonly LOCKOUT_DURATION = 1800; // 30 minutes

    constructor(
        private readonly usersService: UsersService,
        private readonly jwtService: JwtService,
        private readonly redisService: RedisService,
        private readonly logger: Logger,
    ) { }

    async validateUser(email: string, password: string): Promise<any> {
        try {
            const user = await this.usersService.findByEmail(email);

            if (!user) {
                // Timing attack protection
                await argon2.verify('$argon2id$v=19$m=65536,t=3,p=4$dummy', 'dummy');
                throw new UnauthorizedException('Invalid credentials');
            }

            // Check if user is blocked
            const isBlocked = await this.isUserBlocked(user.id);
            if (isBlocked) {
                throw new UnauthorizedException('Account temporarily locked. Try again later.');
            }

            if (!user.isActive) {
                throw new UnauthorizedException('Account is inactive');
            }

            const isPasswordValid = await argon2.verify(user.password, password);

            if (!isPasswordValid) {
                await this.incrementFailedLoginAttempts(user.id);
                throw new UnauthorizedException('Invalid credentials');
            }

            // Reset attempts on successful login
            await this.resetFailedLoginAttempts(user.id);

            const { password: _password, ...result } = user;
            return result;
        } catch (error) {
            if (error instanceof UnauthorizedException) {
                throw error;
            }
            this.logger.error(`Error during user validation: ${error.message}`);
            throw new UnauthorizedException('Invalid credentials');
        }
    }

    async login(user: any, metadata?: LoginMetadata): Promise<AuthResponse> {
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

    async refreshAccessToken(refreshToken: string, userId: string): Promise<AuthResponse> {
        const redisKey = `refresh_token:${userId}:${refreshToken}`;
        const tokenData = await this.redisService.get(redisKey);

        if (!tokenData) {
            throw new UnauthorizedException('Invalid refresh token');
        }

        const metadata: RefreshTokenMetadata = JSON.parse(tokenData);

        if (metadata.expiresAt && new Date() > new Date(metadata.expiresAt)) {
            await this.redisService.del(redisKey);
            throw new UnauthorizedException('Refresh token expired');
        }

        const user = await this.usersService.findById(userId);
        if (!user || !user.isActive) {
            throw new UnauthorizedException('User not found or inactive');
        }

        const accessToken = await this.generateAccessToken(user);

        // Token Rotation
        const newRefreshToken = await this.generateRefreshToken(user, {
            deviceId: metadata.deviceId,
            ipAddress: metadata.ipAddress,
            userAgent: metadata.userAgent,
        });

        // Delete old token
        await this.redisService.del(redisKey);

        return {
            accessToken,
            refreshToken: newRefreshToken,
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
        const payload: TokenPayload = {
            sub: user.id,
            email: user.email,
            type: 'access',
        };

        return this.jwtService.sign(payload, {
            expiresIn: '15m',
        });
    }

    private async generateRefreshToken(user: any, metadata?: LoginMetadata): Promise<string> {
        const token = randomBytes(64).toString('base64url');
        const redisKey = `refresh_token:${user.id}:${token}`;

        const TTL = 7 * 24 * 60 * 60; // 7 days
        const expiresAt = new Date(Date.now() + TTL * 1000);

        const tokenMetadata: RefreshTokenMetadata = {
            token,
            userId: user.id,
            deviceId: metadata?.deviceId,
            ipAddress: metadata?.ipAddress,
            userAgent: metadata?.userAgent,
            expiresAt,
            createdAt: new Date(),
        };

        await this.redisService.setex(redisKey, TTL, JSON.stringify(tokenMetadata));

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

    private async incrementFailedLoginAttempts(userId: string) {
        const key = `${this.FAILED_LOGIN_PREFIX}${userId}`;
        const attempts = await this.redisService.incr(key);

        if (attempts === 1) {
            await this.redisService.expire(key, 900); // 15 mins
        }

        if (attempts >= this.MAX_LOGIN_ATTEMPTS) {
            await this.redisService.setex(`${this.BLOCKED_PREFIX}${userId}`, this.LOCKOUT_DURATION, '1');
            this.logger.warn(`User ${userId} blocked due to multiple failed login attempts`);
            throw new UnauthorizedException('Account temporarily locked. Try again in 30 minutes.');
        }
    }

    private async resetFailedLoginAttempts(userId: string) {
        await this.redisService.del(`${this.FAILED_LOGIN_PREFIX}${userId}`);
    }

    private async isUserBlocked(userId: string): Promise<boolean> {
        const blocked = await this.redisService.get(`${this.BLOCKED_PREFIX}${userId}`);
        return blocked !== null;
    }

    async sendVerificationEmail(userId: string, _email: string) {
        const token = randomBytes(32).toString('hex');

        await this.redisService.setex(`email_verification:${token}`, 3600, userId);

        // TODO: Integrate with EmailService
        // const verificationLink = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;
        // await this.emailService.sendVerificationEmail(email, verificationLink);

        return { message: 'Verification email sent' };
    }

    async verifyEmail(token: string) {
        const userId = await this.redisService.get(`email_verification:${token}`);

        if (!userId) {
            throw new BadRequestException('Invalid or expired verification token');
        }

        // Update user status
        // await this.usersService.update(userId, { isEmailVerified: true, isActive: true });
        await this.redisService.del(`email_verification:${token}`);

        return { message: 'Email verified successfully' };
    }
}
