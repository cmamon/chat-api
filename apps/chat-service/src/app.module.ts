import { Module } from '@nestjs/common';
import { PrismaModule } from '@app/database';
import { ChatController } from './chat.controller';

@Module({
  imports: [PrismaModule],
  controllers: [ChatController],
  providers: [],
})
export class AppModule {}
