import { Injectable } from '@nestjs/common';
import { Redis } from 'ioredis';

interface Filters {
  price?: {
    gte?: number;
    lte?: number;
  };
  category?: {
    name: string;
  };
  isFeatured?: boolean;
}
@Injectable()
export class RedisService {
  private readonly redisClient: Redis;
  private redisKeys: { [storeId: string]: string } = {};
  private redisKeysForReviews: { [productId: string]: string } = {};
  constructor() {
    try {
      this.redisClient = new Redis({
        host: 'cache-db', // Redis service name defined in Docker Compose
        port: 6379, // Redis port
      });
      this.redisClient.on('connect', () => {
        console.log('Connected to Redis');
      });

      this.redisClient.on('error', (error) => {
        console.error('Redis error:', error);
      });
    } catch (error) {
      console.log('redis_connection', error);
    }
  }
  async deleteValue(key: string) {
    await this.redisClient.del(key);
  }
  async setValueToHash(key: string, hash: string, value: string) {
    await this.redisClient.hset(key, hash, value);
    this.redisClient.expire(key, 120 * 60);
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
    await this.redisClient.rpush(key, value);
    this.redisClient.expire(key, 120 * 60);
  }
  async getValueFromList(key: string) {
    const serializedValue = await this.redisClient.lrange(key, 0, -1);
    return serializedValue[0];
  }
  async setValueAsString(key: string, value: string) {
    await this.redisClient.set(key, value);
    this.redisClient.expire(key, 120 * 60);
  }
  async getValueAsString(key: string) {
    const serializedValue = await this.redisClient.get(key);
    return serializedValue;
  }
  async setResetpassword(key: string, value: string) {
    await this.redisClient.set(key, value);
    this.redisClient.expire(key, 300000);
  }
  setRedisKey(
    storeId: string,
    filters: Filters,
    page: number,
    perPage: number,
  ) {
    this.redisKeys[storeId] = `products:${storeId}:${JSON.stringify(
      filters,
    )}:${page}:${perPage}`;
  }

  getRedisKey(storeId: string): string {
    return this.redisKeys[storeId] || '';
  }
  setRedisKeyForReviews(productId: string, page: number, perPage: number) {
    this.redisKeysForReviews[
      productId
    ] = `reviews:${productId}:${page}:${perPage}`;
  }
  getRedisKeyForReviews(productId: string): string {
    return this.redisKeysForReviews[productId] || '';
  }
}
