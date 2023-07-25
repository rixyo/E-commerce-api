import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { RedisService } from 'src/redis/redis.service';

@Injectable()
export class ColorService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly redisService: RedisService,
  ) {}
  async getAllColors(storeId: string) {
    const colorsFromCache = await this.redisService.getValue(
      `getAllColors+${storeId}`,
    );
    if (colorsFromCache === 'null' || !colorsFromCache) {
      const colors = await this.prismaService.color.findMany({
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
      if (!colors) throw new NotFoundException('Colors not found');
      await this.redisService.setValue(
        `getAllColors+${storeId}`,
        JSON.stringify(colors),
      );
      return colors;
    }
    return JSON.parse(colorsFromCache);
  }
  async getColorById(id: string) {
    const colorFromCache = await this.redisService.getValue(id);
    if (colorFromCache === 'null' || !colorFromCache) {
      const color = await this.prismaService.color.findUnique({
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
      if (!color) throw new NotFoundException('Color not found');
      await this.redisService.setValue(id, JSON.stringify(color));
      return color;
    }
    return JSON.parse(colorFromCache);
  }
  async createColor(name: string, storeId: string, value: string) {
    const color = await this.prismaService.color.create({
      data: {
        name: name,
        storeId: storeId,
        value: value,
      },
      select: {
        id: true,
        name: true,
        storeId: true,
        value: true,
      },
    });
    await Promise.all([
      this.redisService.setValue(color.id, JSON.stringify(color)),
      this.redisService.setValue(`getAllColors+${storeId}`, 'null'),
    ]);
    return color;
  }
  async updateColor(id: string, name: string, value: string) {
    const color = await this.prismaService.color.update({
      where: {
        id: id,
      },
      data: {
        name: name,
        value: value,
      },
      select: {
        id: true,
        storeId: true,
        name: true,
        value: true,
      },
    });
    await Promise.all([
      this.redisService.setValue(id, JSON.stringify(color)),
      this.redisService.setValue(`getAllColors+${color.storeId}`, 'null'),
    ]);
  }
  async deleteColor(id: string) {
    const color = await this.prismaService.color.delete({
      where: {
        id: id,
      },
    });
    await Promise.all([
      this.redisService.deleteValue(id),
      this.redisService.deleteValue(`getAllColors+${color.storeId}`),
    ]);
    return 'Delete color successfully';
  }
}
