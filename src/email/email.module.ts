import { Module } from '@nestjs/common';
import { EmailService } from './email.service';
import { RedisModule } from '../redis/redis.module';

@Module({
  imports: [RedisModule],
  exports: [EmailService],
  providers: [EmailService],
})
export class EmailModule {}
