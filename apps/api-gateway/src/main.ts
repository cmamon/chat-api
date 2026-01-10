import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // Basic setup for verification
  await app.listen(3000);
  console.log(`API Gateway is running on port 3000`);
}
bootstrap();
