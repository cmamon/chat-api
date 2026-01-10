import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { RedisService } from '../redis/redis.service';
import { Logger } from '@app/logger';
import * as argon2 from 'argon2';

jest.mock('argon2');

describe('AuthService', () => {
  let service: AuthService;
  let usersService: jest.Mocked<UsersService>;
  let jwtService: jest.Mocked<JwtService>;
  let redisService: jest.Mocked<RedisService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: {
            findByEmail: jest.fn(),
            findById: jest.fn(),
            updateLastLogin: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(),
          },
        },
        {
          provide: RedisService,
          useValue: {
            setex: jest.fn(),
            get: jest.fn(),
            del: jest.fn(),
            incr: jest.fn(),
            expire: jest.fn(),
            keys: jest.fn(),
          },
        },
        {
          provide: Logger,
          useValue: {
            log: jest.fn(),
            error: jest.fn(),
            warn: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get(UsersService);
    jwtService = module.get(JwtService);
    redisService = module.get(RedisService);
  });

  describe('hashPassword', () => {
    it('should hash a password using argon2', async () => {
      const password = 'Password123!';
      const hash = await service.hashPassword(password);
      expect(hash).toBeDefined();
      expect(hash).toContain('$argon2');
    });
  });

  describe('validatePasswordStrength', () => {
    it('should return valid true for a strong password', () => {
      const result = service.validatePasswordStrength('TestPassword123!');
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should return valid false for a short password', () => {
      const result = service.validatePasswordStrength('Short1!');
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('at least 12 characters');
    });

    it('should return valid false if missing special character', () => {
      const result = service.validatePasswordStrength('TestPassword123');
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('at least one special character');
    });
  });

  describe('validateUser', () => {
    const email = 'test@example.com';
    const password = 'Password123!';
    const hashedPassword = '$argon2id$v=19$m=65536,t=3,p=4$somehash';

    it('should return user without password if credentials are valid', async () => {
      const user = { id: '1', email, password: hashedPassword, isActive: true };
      usersService.findByEmail.mockResolvedValue(user as any);

      (argon2.verify as jest.Mock).mockResolvedValue(true);

      const result = await service.validateUser(email, password);
      expect(result).toBeDefined();
      expect(result.password).toBeUndefined();
      expect(result.id).toBe('1');
    });

    it('should throw UnauthorizedException if user not found', async () => {
      usersService.findByEmail.mockResolvedValue(null);
      await expect(service.validateUser(email, password)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if password invalid', async () => {
      const user = { id: '1', email, password: hashedPassword, isActive: true };
      usersService.findByEmail.mockResolvedValue(user as any);

      (argon2.verify as jest.Mock).mockResolvedValue(false);

      await expect(service.validateUser(email, password)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('login', () => {
    it('should generate access and refresh tokens', async () => {
      const user = { id: '1', email: 'test@example.com' };
      jwtService.sign.mockReturnValue('access_token');
      redisService.setex.mockResolvedValue(undefined);
      redisService.keys.mockResolvedValue([]);

      const result = await service.login(user);

      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
      expect(usersService.updateLastLogin).toHaveBeenCalledWith('1');
    });
  });

  describe('refreshAccessToken', () => {
    it('should generate a new access token if refresh token is valid', async () => {
      const userId = '1';
      const refreshToken = 'valid_token';
      const tokenData = JSON.stringify({
        token: refreshToken,
        userId,
        expiresAt: new Date(Date.now() + 10000).toISOString(),
      });

      redisService.get.mockResolvedValue(tokenData);
      usersService.findById.mockResolvedValue({ id: userId, email: 'test@example.com', isActive: true } as any);
      jwtService.sign.mockReturnValue('new_access_token');

      const result = await service.refreshAccessToken(refreshToken, userId);

      expect(result.accessToken).toBe('new_access_token');
    });

    it('should throw UnauthorizedException if refresh token not found', async () => {
      redisService.get.mockResolvedValue(null);
      await expect(service.refreshAccessToken('invalid', '1')).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('logout', () => {
    it('should delete refresh token from redis', async () => {
      await service.logout('token', '1');
      expect(redisService.del).toHaveBeenCalledWith('refresh_token:1:token');
    });
  });

  describe('logoutAllDevices', () => {
    it('should delete all refresh tokens for a user', async () => {
      redisService.keys.mockResolvedValue(['rt1', 'rt2']);
      await service.logoutAllDevices('1');
      expect(redisService.del).toHaveBeenCalled();
    });
  });

  describe('enforceMaxSessions', () => {
    it('should remove oldest session if limit exceeded', async () => {
      const userId = '1';
      const keys = ['key1', 'key2', 'key3', 'key4', 'key5'];
      redisService.keys.mockResolvedValue(keys);

      const sessionData = (createdAt: string) => JSON.stringify({ createdAt });
      redisService.get
        .mockResolvedValueOnce(sessionData('2023-01-01'))
        .mockResolvedValueOnce(sessionData('2023-01-02'))
        .mockResolvedValueOnce(sessionData('2023-01-03'))
        .mockResolvedValueOnce(sessionData('2023-01-04'))
        .mockResolvedValueOnce(sessionData('2023-01-05'));

      // Use any to bypass private method check or just use (service as any)
      await (service as any).enforceMaxSessions(userId);

      expect(redisService.del).toHaveBeenCalledWith('key1');
    });
  });
});
