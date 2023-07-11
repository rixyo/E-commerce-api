import { Injectable } from '@nestjs/common';
import { Redis } from 'ioredis';
@Injectable()
export class RedisService {
  private readonly redisClient: Redis;
  constructor() {
    this.redisClient = new Redis(process.env.REDIS_URL);
  }
  async setValue(key: string, value: string) {
    await this.redisClient.set(key, value);
  }

  async getValue(key: string) {
    const value = await this.redisClient.get(key);
    return value;
  }
}
