import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { RedisService } from 'src/redis/redis.service';

@Injectable()
export class BillboardService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly redisService: RedisService,
  ) {}
  async createBillboard(label: string, imageUrl: string, storeId: string) {
    const billboard = await this.prismaService.billboard.create({
      data: {
        label: label,
        imageUrl: imageUrl,
        storeId: storeId,
      },
      select: {
        id: true,
        label: true,
        imageUrl: true,
        storeId: true,
      },
    });
    await this.redisService.setValue(billboard.id, JSON.stringify(billboard));
    await this.redisService.setValue('getBillboards', 'null');
    await this.redisService.setValue(
      `getAllBillboard+${billboard.storeId}`,
      'null',
    );
    return billboard;
  }
  async getBillboardById(id: string) {
    const cachedBillboard = await this.redisService.getValue(id);
    if (!cachedBillboard || cachedBillboard === null) {
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
      await this.redisService.setValue(id, JSON.stringify(billboard));
      return billboard;
    }
    return JSON.parse(cachedBillboard);
  }
  async updateBillboardById(id: string, label: string, imageUrl: string) {
    const billboard = await this.prismaService.billboard.update({
      where: {
        id: id,
      },
      data: {
        label: label,
        imageUrl: imageUrl,
      },
      select: {
        id: true,
        label: true,
        imageUrl: true,
        storeId: true,
      },
    });
    await Promise.all([
      this.redisService.setValue(id, JSON.stringify(billboard)),
      this.redisService.setValue(
        `getAllBillboard+${billboard.storeId}`,
        'null',
      ),
      this.redisService.setValue('getBillboards', 'null'),
    ]);
    await this.redisService.setValue(id, JSON.stringify(billboard));
    return billboard;
  }
  async deleteBillboardById(id: string) {
    const billboard = await this.prismaService.billboard.delete({
      where: {
        id: id,
      },
    });
    await Promise.all([
      this.redisService.deleteValue('getBillboards'),
      this.redisService.deleteValue(id),
      this.redisService.deleteValue(`getAllBillboard+${billboard.storeId}`),
    ]);
    return 'deleted successfully';
  }
  async getAllBillboard(storeId: string) {
    const cachedBillboards = await this.redisService.getValue(
      `getAllBillboard+${storeId}`,
    );
    if (cachedBillboards === 'null' || !cachedBillboards) {
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
      await this.redisService.setValue(
        `getAllBillboard+${storeId}`,
        JSON.stringify(billboards),
      );
      return billboards;
    }
    return JSON.parse(cachedBillboards);
  }
  async getBillboards() {
    const cachedBillboards = await this.redisService.getValue('getBillboards');
    if (cachedBillboards === 'null' || !cachedBillboards) {
      const billboards = await this.prismaService.billboard.findMany({
        select: {
          id: true,
          label: true,
          imageUrl: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
      if (!billboards || billboards.length === 0) {
        throw new NotFoundException('Billboards not found');
      }
      await this.redisService.setValue(
        'getBillboards',
        JSON.stringify(billboards),
      );
      return billboards;
    }
    return JSON.parse(cachedBillboards);
  }
}
