import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';

@Controller()
export class ChatController {
  @MessagePattern('ping')
  ping(@Payload() data: any) {
    return { message: 'pong', received: data };
  }
}
