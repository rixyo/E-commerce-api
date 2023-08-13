import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
// create interface for create color
interface CreateColor {
  name: string;
  value: string;
}
@Injectable()
export class ColorService {
  constructor(
    private readonly prismaService: PrismaService, // inject prisma service or create instance of prisma service
    private readonly redisService: RedisService, // inject redis service or create instance of redis service
  ) {}
  async getAllColors(storeId: string) {
    // get colors from redisCache
    const colorsFromRedis = await this.redisService.getValueFromList('colors');
    if (colorsFromRedis && colorsFromRedis.length !== 0) return colorsFromRedis;
    else {
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
      // set colors to redisCache
      await this.redisService.setValueToList('colors', JSON.stringify(colors));

      return colors;
    }
  }
  async getColorById(id: string) {
    // get color from redisCache
    const colorFromRedis = await this.redisService.getValueFromHash(
      id,
      'color',
    );
    if (colorFromRedis) return colorFromRedis;
    else {
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
      // set color to redisCache
      await this.redisService.setValueToHash(
        id,
        'color',
        JSON.stringify(color),
      );

      return color;
    }
  }
  async createColor(data: CreateColor, storeId: string) {
    try {
      const color = await this.prismaService.color.create({
        data: {
          name: data.name,
          storeId: storeId,
          value: data.value,
        },
        select: {
          id: true,
        },
      });
      await this.redisService.deleteValue('colors');
      return color;
    } catch (error) {
      throw new Error("Can't create color");
    }
  }
  async updateColor(id: string, data: CreateColor) {
    try {
      await this.prismaService.color.update({
        where: {
          id: id,
        },
        data: {
          name: data.name,
          value: data.value,
        },
      });
      Promise.all([
        this.redisService.deleteValue(id),
        this.redisService.deleteValue('colors'),
      ]);
      return 'Update color successfully';
    } catch (error) {
      throw new Error("Can't update color");
    }
  }
  async deleteColor(id: string) {
    try {
      await this.prismaService.color.delete({
        where: {
          id: id,
        },
      });
      await Promise.all([
        this.redisService.deleteValue(id),
        this.redisService.deleteValue('colors'),
      ]);
      return 'Delete color successfully';
    } catch (error) {
      throw new Error("Can't delete color");
    }
  }
}
