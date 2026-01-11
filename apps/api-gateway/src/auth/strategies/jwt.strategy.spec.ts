import { Test, TestingModule } from '@nestjs/testing';
import { JwtStrategy } from './jwt.strategy';
import { UsersService } from '../../users/users.service';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;
  let usersService: jest.Mocked<UsersService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        {
          provide: UsersService,
          useValue: {
            findById: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue('secret'),
          },
        },
      ],
    }).compile();

    strategy = module.get<JwtStrategy>(JwtStrategy);
    usersService = module.get(UsersService);
  });

  it('should be defined', () => {
    expect(strategy).toBeDefined();
  });

  describe('validate', () => {
    it('should validate and return user data', async () => {
      const payload = { sub: '123', email: 'test@example.com', username: 'testuser' };
      const user = { id: '123', email: 'test@example.com', username: 'testuser', isActive: true };

      usersService.findById.mockResolvedValue(user as any);

      const result = await strategy.validate(payload);

      expect(usersService.findById).toHaveBeenCalledWith('123');
      expect(result).toEqual({
        userId: '123',
        email: 'test@example.com',
        username: 'testuser',
      });
    });

    it('should throw UnauthorizedException if user not found', async () => {
      usersService.findById.mockResolvedValue(null);
      await expect(strategy.validate({ sub: '123' })).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if user is inactive', async () => {
      const user = { id: '123', isActive: false };
      usersService.findById.mockResolvedValue(user as any);
      await expect(strategy.validate({ sub: '123' })).rejects.toThrow(UnauthorizedException);
    });
  });
});
