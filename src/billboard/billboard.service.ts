import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { RedisService } from 'src/redis/redis.service';
interface CreateBillboard {
  label: string;
  imageUrl: string;
}
@Injectable()
export class BillboardService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly redisService: RedisService,
  ) {}
  async createBillboard(data: CreateBillboard, storeId: string) {
    try {
      const billboard = await this.prismaService.billboard.create({
        data: {
          label: data.label,
          imageUrl: data.imageUrl,
          storeId: storeId,
        },
      });
      await this.redisService.setValue(billboard.id, 'null');
      await this.redisService.setValue('getBillboards', 'null');
      await this.redisService.setValue(
        `getAllBillboard+${billboard.storeId}`,
        'null',
      );
      return billboard;
    } catch (error) {
      throw new NotFoundException(error.message);
    }
  }
  async getBillboardById(id: string) {
    try {
      const cachedBillboard = await this.redisService.getValue(id);
      if (!cachedBillboard || cachedBillboard === 'null') {
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
    } catch (error) {
      throw new NotFoundException(error.message);
    }
  }
  async updateBillboardById(id: string, data: CreateBillboard) {
    try {
      const billboard = await this.prismaService.billboard.update({
        where: {
          id: id,
        },
        data: {
          label: data.label,
          imageUrl: data.imageUrl,
        },
      });
      await Promise.all([
        this.redisService.setValue(id, 'null'),
        this.redisService.setValue(
          `getAllBillboard+${billboard.storeId}`,
          'null',
        ),
        this.redisService.setValue('getBillboards', 'null'),
      ]);
      await this.redisService.setValue(id, JSON.stringify(billboard));
      return billboard;
    } catch (error) {
      throw new NotFoundException(error.message);
    }
  }
  async deleteBillboardById(id: string) {
    try {
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
    } catch (error) {
      throw new NotFoundException(error.message);
    }
  }
  async getAllBillboard(storeId: string) {
    try {
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
    } catch (error) {
      throw new NotFoundException(error.message);
    }
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
