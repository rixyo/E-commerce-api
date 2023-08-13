import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
interface CreateSize {
  name: string;
  value: string;
}
@Injectable()
export class SizeService {
  constructor(
    private readonly prismaService: PrismaService, // inject prisma service or create instance of prisma service
    private readonly redisService: RedisService, // inject redis service or create instance of redis service
  ) {}
  async getAllSizes(storeId: string) {
    // get sizes from redisCache
    const sizesFromRedis = await this.redisService.getValueFromList('sizes');
    if (sizesFromRedis && sizesFromRedis.length !== 0) return sizesFromRedis;
    else {
      const sizes = await this.prismaService.size.findMany({
        where: {
          storeId: storeId,
        },
        select: {
          id: true,
          name: true,
          value: true,
          storeId: true,
          createdAt: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
      if (!sizes) throw new NotFoundException('Sizes not found');
      // set sizes to redisCache
      await this.redisService.setValueToList('sizes', JSON.stringify(sizes));
      return sizes;
    }
  }
  async getSizeById(id: string) {
    // get size from redisCache
    const sizeFromRedis = await this.redisService.getValueFromHash(id, 'size');
    if (sizeFromRedis) return sizeFromRedis;
    else {
      const size = await this.prismaService.size.findUnique({
        where: {
          id: id,
        },
        select: {
          id: true,
          name: true,
          storeId: true,
          value: true,
        },
      });
      if (!size) throw new NotFoundException('Size not found');
      // set size to redisCache
      await this.redisService.setValueToHash(id, 'size', JSON.stringify(size));
      return size;
    }
  }
  async createSize(data: CreateSize, storeId: string) {
    try {
      const size = await this.prismaService.size.create({
        data: {
          name: data.name,
          storeId: storeId,
          value: data.value,
        },
        select: {
          id: true,
        },
      });

      await this.redisService.deleteValue('sizes');

      return size;
    } catch (error) {
      return 'Size creation failed';
    }
  }
  async updateSize(id: string, data: CreateSize) {
    try {
      await this.prismaService.size.update({
        where: {
          id: id,
        },
        data: {
          name: data.name,
          value: data.value,
        },
      });
      Promise.all([
        this.redisService.deleteValue('sizes'),
        this.redisService.deleteValue(id),
      ]);
      return 'Update size successfully';
    } catch (error) {
      return 'Store not found';
    }
  }
  async deleteSize(id: string) {
    try {
      await this.prismaService.size.delete({
        where: {
          id: id,
        },
      });
      Promise.all([
        this.redisService.deleteValue('sizes'),
        this.redisService.deleteValue(id),
      ]);
      return 'Delete size successfully';
    } catch (error) {
      return 'Store not found';
    }
  }
}
