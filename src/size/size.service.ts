import { Injectable, NotFoundException } from '@nestjs/common';
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
    if (!sizesFromCache || sizesFromCache === 'null') {
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
      await this.redisService.setValue(
        `getAllSizes+${storeId}`,
        JSON.stringify(sizes),
      );
      return sizes;
    }
    return JSON.parse(sizesFromCache);
  }
  async getSizeById(id: string) {
    const sizeFromCache = await this.redisService.getValue(id);
    if (sizeFromCache === 'null' || !sizeFromCache) {
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
      await this.redisService.setValue(id, JSON.stringify(size));
      return size;
    }
    return JSON.parse(sizeFromCache);
  }
  async createSize(name: string, storeId: string, value: string) {
    const size = await this.prismaService.size.create({
      data: {
        name: name,
        storeId: storeId,
        value: value,
      },
    });
    await this.redisService.setValue(size.id, JSON.stringify(size));
    await this.redisService.setValue(`getAllSizes+${storeId}`, 'null');
    return size;
  }
  async updateSize(id: string, name: string, value: string) {
    const size = await this.prismaService.size.update({
      where: {
        id: id,
      },
      data: {
        name: name,
        value: value,
      },
    });
    await this.redisService.setValue(id, JSON.stringify(size));
    await this.redisService.setValue(`getAllSizes+${size.storeId}`, 'null');
    return size;
  }
  async deleteSize(id: string) {
    const size = await this.prismaService.size.delete({
      where: {
        id: id,
      },
    });
    await this.redisService.deleteValue(id);
    await this.redisService.deleteValue(`getAllSizes+${size.storeId}`);
    return 'Delete size successfully';
  }
}
