import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { RedisService } from 'src/redis/redis.service';

@Injectable()
export class SizeService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly redisService: RedisService,
  ) {}
  async getAllSizes(storeId: string) {
    const sizesFromCache = await this.redisService.getValue(
      `getAllSizes+${storeId}`,
    );
    if (sizesFromCache === 'null' || !sizesFromCache) {
      const sizes = await this.prismaService.size.findMany({
        where: {
          storeId: storeId,
        },
        select: {
          id: true,
          name: true,
          storeId: true,
          createdAt: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
      await this.redisService.setValue(
        `getAllSizes+${storeId}`,
        JSON.stringify(sizes),
      );
      return sizes;
    }
    return JSON.parse(sizesFromCache);
  }
}
