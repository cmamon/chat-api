import { Module } from '@nestjs/common';
import { PrismaModule } from '@app/database';
import { HealthController } from './health.controller';

@Module({
  imports: [PrismaModule],
  controllers: [HealthController],
  providers: [],
})
export class AppModule {}
