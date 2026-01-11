import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { LoggerModule } from '@app/logger';
import { ChatGateway } from './chat/chat.gateway';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', 'test.env', '../../test.env'],
    }),
    LoggerModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get('JWT_SECRET') || 'defaultSecret',
        signOptions: { expiresIn: '1h' },
      }),
    }),
  ],
  controllers: [],
  providers: [ChatGateway],
})
export class AppModule {}
