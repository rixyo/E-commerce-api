import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
// create interface for create billboard
interface CreateBillboard {
  label: string;
  imageUrl: string;
}
@Injectable()
export class BillboardService {
  constructor(
    private readonly prismaService: PrismaService, // inject prisma service or create instance of prisma service
    private readonly redisService: RedisService, // inject redis service or create instance of redis service
  ) {}
  async createBillboard(data: CreateBillboard, storeId: string) {
    try {
      const billboard = await this.prismaService.billboard.create({
        data: {
          label: data.label,
          imageUrl: data.imageUrl,
          storeId: storeId,
        },
        select: {
          id: true,
        },
      });
      Promise.all([
        this.redisService.deleteValue('billboards'),
        this.redisService.deleteValue('usersbillboard'),
      ]);
      return billboard;
    } catch (error) {
      return 'Something went wrong';
    }
  }
  async getBillboardById(id: string) {
    // get billboard from redisCache
    const billboardFromRedis = await this.redisService.getValueFromHash(
      id,
      'billboard',
    );
    if (billboardFromRedis) return billboardFromRedis;
    else {
      const billboard = await this.prismaService.billboard.findUnique({
        where: {
          id: id,
        },
        select: {
          id: true,
          label: true,
          imageUrl: true,
        },
      });
      if (!billboard) throw new NotFoundException('Billboard not found');
      // set billboard to redisCache
      await this.redisService.setValueToHash(
        id,
        'billboard',
        JSON.stringify(billboard),
      );
      return billboard;
    }
  }
  async updateBillboardById(id: string, data: CreateBillboard) {
    try {
      await this.prismaService.billboard.update({
        where: {
          id: id,
        },
        data: {
          label: data.label,
          imageUrl: data.imageUrl,
        },
      });
      Promise.all([
        this.redisService.deleteValue(id),
        this.redisService.deleteValue('billboards'),
        this.redisService.deleteValue('usersbillboard'),
      ]);
      return 'updated successfully';
    } catch (error) {
      throw new Error("Can't update billboard");
    }
  }
  async deleteBillboardById(id: string) {
    try {
      await this.prismaService.billboard.delete({
        where: {
          id: id,
        },
      });
      Promise.all([
        this.redisService.deleteValue(id),
        this.redisService.deleteValue('billboards'),
        this.redisService.deleteValue('usersbillboard'),
      ]);
      return 'deleted successfully';
    } catch (error) {
      throw new Error("Can't delete billboard");
    }
  }
  async getAllBillboards(storeId: string) {
    // get billboards from redisCache
    const billboardsFromRedis = await this.redisService.getValueFromList(
      'billboards',
    );
    if (billboardsFromRedis && billboardsFromRedis.length !== 0)
      return billboardsFromRedis;
    const billboards = await this.prismaService.billboard.findMany({
      where: {
        storeId: storeId,
      },
      select: {
        id: true,
        label: true,
        imageUrl: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    if (!billboards || billboards.length === 0) {
      throw new NotFoundException('Billboards not found');
    }
    // set billboards to redisCache
    await this.redisService.setValueToList(
      'billboards',
      JSON.stringify(billboards),
    );

    return billboards;
  }
  async getBillboards() {
    // get billboards from redisCache
    const billboardsFromRedis = await this.redisService.getValueFromList(
      'usersbillboard',
    );
    if (billboardsFromRedis && billboardsFromRedis.length !== 0)
      return billboardsFromRedis;
    else {
      const billboards = await this.prismaService.billboard.findMany({
        select: {
          id: true,
          label: true,
          imageUrl: true,
          createdAt: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
      if (!billboards || billboards.length === 0) {
        throw new NotFoundException('Billboards not found');
      }
      // set billboards to redisCache
      await this.redisService.setValueToList(
        'usersbillboard',
        JSON.stringify(billboards),
      );

      return billboards;
    }
  }
}
