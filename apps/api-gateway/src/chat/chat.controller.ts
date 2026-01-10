import { Controller, Get, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { CHAT_SERVICE } from '@app/common';
import { Public } from '../auth/decorators/public.decorator';

@Controller('chat')
export class ChatController {
  constructor(@Inject(CHAT_SERVICE) private readonly chatClient: ClientProxy) {}

  @Public()
  @Get('ping')
  ping() {
    return this.chatClient.send('ping', { timestamp: new Date() });
  }
}
