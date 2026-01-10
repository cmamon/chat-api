import { Module } from '@nestjs/common';
import { PrismaModule } from '@app/database';

@Module({
  imports: [PrismaModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
