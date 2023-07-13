import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { RedisModule } from 'src/redis/redis.module';

@Module({
    imports: [PrismaModule,RedisModule],
})
export class BillboardModule {}
