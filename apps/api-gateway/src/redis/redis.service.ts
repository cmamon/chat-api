import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import Redis from 'ioredis';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@app/logger';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client: Redis;

  constructor(
    private readonly configService: ConfigService,
    private readonly logger: Logger,
  ) {}

  onModuleInit() {
    const host = this.configService.get<string>('REDIS_HOST', 'localhost');
    const port = this.configService.get<number>('REDIS_PORT', 6379);

    this.client = new Redis({
      host,
      port,
      maxRetriesPerRequest: null,
    });

    this.client.on('error', (err) => {
      this.logger.error(`Redis Error: ${err.message}`);
    });

    this.client.on('connect', () => {
      this.logger.log('Connected to Redis');
    });
  }

  onModuleDestroy() {
    this.client.disconnect();
  }

  async set(key: string, value: string, ttl?: number): Promise<void> {
    if (ttl) {
      await this.client.setex(key, ttl, value);
    } else {
      await this.client.set(key, value);
    }
  }

  async get(key: string): Promise<string | null> {
    return this.client.get(key);
  }

  async del(...keys: string[]): Promise<void> {
    if (keys.length > 0) {
      await this.client.del(...keys);
    }
  }

  async incr(key: string): Promise<number> {
    return this.client.incr(key);
  }

  async expire(key: string, seconds: number): Promise<void> {
    await this.client.expire(key, seconds);
  }

  async keys(pattern: string): Promise<string[]> {
    return this.client.keys(pattern);
  }

  async setex(key: string, seconds: number, value: string): Promise<void> {
    await this.client.setex(key, seconds, value);
  }
}
