import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // Basic setup for verification
  await app.listen(3001);
  console.log(`WebSocket Gateway is running on port 3001`);
}
bootstrap();
