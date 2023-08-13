import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { RedisModule } from '../redis/redis.module';
import { BillboardService } from './billboard.service';
import { BillboardController } from './billboard.controller';

@Module({
  imports: [PrismaModule, RedisModule],
  providers: [BillboardService],
  controllers: [BillboardController],
})
export class BillboardModule {}
