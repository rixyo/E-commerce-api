import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { RedisModule } from '../redis/redis.module';
import { StoreController } from './store.controller';
import { StoreService } from './store.service';

@Module({
  imports: [PrismaModule, RedisModule],
  providers: [StoreService],
  controllers: [StoreController],
})
export class StoreModule {}
