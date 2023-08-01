import { Injectable } from '@nestjs/common';
import { Redis } from 'ioredis';
@Injectable()
export class RedisService {
  private readonly redisClient: Redis;
  constructor() {
    try {
      this.redisClient = new Redis(process.env.REDIS_URL);
    } catch (error) {
      console.log('redis_connection', error);
    }
  }
  async deleteValue(key: string) {
    await this.redisClient.del(key);
  }
  async setValueToHash(key: string, hash: string, value: string) {
    if (value) {
      await this.redisClient.hset(key, hash, value, 'EX', 60 * 60 * 24 * 1);
    }
  }
  async getValueFromHash(key: string, hash: string) {
    const serializedValue = await this.redisClient.hget(key, hash);
    if (serializedValue) {
      return JSON.parse(serializedValue);
    } else {
      return null;
    }
  }
  async setValueToList(key: string, value: string) {
    if (value) {
      await this.redisClient.rpush(key, value, 'EX', 60 * 60 * 24 * 1);
    }
  }
  async getValueFromList(key: string) {
    const serializedValue = await this.redisClient.lrange(key, 0, -1);
    if (serializedValue) {
      return serializedValue[0];
    } else {
      return null;
    }
  }
}
