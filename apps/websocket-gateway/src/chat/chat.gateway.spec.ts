import { Test, TestingModule } from '@nestjs/testing';
import { ChatGateway } from './chat.gateway';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@app/logger';
import { Socket } from 'socket.io';

describe('ChatGateway', () => {
  let gateway: ChatGateway;
  let jwtService: jest.Mocked<JwtService>;
  let configService: jest.Mocked<ConfigService>;
  let logger: jest.Mocked<Logger>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatGateway,
        {
          provide: JwtService,
          useValue: {
            verify: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(),
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

    gateway = module.get<ChatGateway>(ChatGateway);
    jwtService = module.get(JwtService);
    configService = module.get(ConfigService);
    logger = module.get(Logger);
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });

  describe('handleConnection', () => {
    it('should disconnect if no token provided', async () => {
      const client = {
        handshake: { auth: {} },
        disconnect: jest.fn(),
      } as unknown as Socket;

      await gateway.handleConnection(client);

      expect(client.disconnect).toHaveBeenCalled();
      expect(logger.warn).toHaveBeenCalledWith('Connection attempt without token');
    });

    it('should verify token and attach user data', async () => {
      const client = {
        handshake: { auth: { token: 'valid_token' } },
        data: {},
        id: 'socket_id',
        disconnect: jest.fn(),
      } as unknown as Socket;

      configService.get.mockReturnValue('secret');
      jwtService.verify.mockReturnValue({ sub: '123', email: 'test@test.com', username: 'Tester' });

      await gateway.handleConnection(client);

      expect(jwtService.verify).toHaveBeenCalledWith('valid_token', { secret: 'secret' });
      expect(client.data).toEqual({ userId: '123', email: 'test@test.com', username: 'Tester' });
      expect(logger.log).toHaveBeenCalledWith(expect.stringContaining('Client connected'));
    });

    it('should disconnect on verification failure', async () => {
      const client = {
        handshake: { auth: { token: 'invalid_token' } },
        disconnect: jest.fn(),
      } as unknown as Socket;

      configService.get.mockReturnValue('secret');
      jwtService.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await gateway.handleConnection(client);

      expect(client.disconnect).toHaveBeenCalled();
      expect(logger.error).toHaveBeenCalledWith(expect.stringContaining('Connection verification failed'));
    });
  });
});
