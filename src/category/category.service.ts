import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { RedisService } from 'src/redis/redis.service';

type Filers = {
  gender?: string;
};
interface CreateCategory {
  name: string;
  billboardId: string;
  gender: string;
  imageUrl: string;
}
@Injectable()
export class CategoryService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly redisService: RedisService,
  ) {}
  async getAllCategories(storeId: string) {
    const categoriesFromCache = await this.redisService.getValue(
      `getAllCategories+${storeId}`,
    );
    if (!categoriesFromCache || categoriesFromCache === 'null') {
      const categories = await this.prismaService.category.findMany({
        where: {
          storeId: storeId,
        },
        select: {
          id: true,
          name: true,
          storeId: true,
          gender: true,
          imageUrl: true,
          billboard: {
            select: {
              id: true,
              label: true,
            },
          },
          createdAt: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
      if (!categories) throw new NotFoundException('Categories not found');
      await this.redisService.setValue(
        `getAllCategories+${storeId}`,
        JSON.stringify(categories),
      );
      return categories;
    }
    return JSON.parse(categoriesFromCache);
  }
  async getCategoryById(id: string) {
    const categoryFromCache = await this.redisService.getValue(id);
    if (!categoryFromCache || categoryFromCache === 'null') {
      const category = await this.prismaService.category.findUnique({
        where: {
          id: id,
        },
        select: {
          id: true,
          name: true,
          gender: true,
          imageUrl: true,
          storeId: true,
          billboard: {
            select: {
              id: true,
              label: true,
            },
          },
          createdAt: true,
        },
      });
      if (!category) throw new NotFoundException('Category not found');
      await this.redisService.setValue(id, JSON.stringify(category));
      return category;
    }
    return JSON.parse(categoryFromCache);
  }
  async createCategory(data: CreateCategory, storeId: string) {
    try {
      const category = await this.prismaService.category.create({
        data: {
          name: data.name,
          storeId: storeId,
          billboardId: data.billboardId,
          gender: data.gender,
          imageUrl: data.imageUrl,
        },
      });
      await Promise.all([
        this.redisService.setValue(category.id, 'null'),
        this.redisService.setValue(`getAllCategories+${storeId}`, 'null'),
      ]);
      return category;
    } catch (error) {
      throw new NotFoundException(error.message);
    }
  }
  async updateCategoryById(id: string, data: CreateCategory) {
    try {
      const category = await this.prismaService.category.update({
        where: {
          id: id,
        },
        data: {
          name: data.name,
          gender: data.gender,
          imageUrl: data.imageUrl,
        },
      });
      await Promise.all([
        this.redisService.setValue(
          `getAllCategories+${category.storeId}`,
          'null',
        ),
        this.redisService.setValue(id, 'null'),
      ]);
      return category;
    } catch (error) {
      throw new NotFoundException(error.message);
    }
  }
  async deleteCategoryById(id: string) {
    try {
      const category = await this.prismaService.category.delete({
        where: {
          id: id,
        },
      });
      await Promise.all([
        await this.redisService.deleteValue(id),
        await this.redisService.deleteValue(
          `getAllCategories+${category.storeId}`,
        ),
      ]);
      return 'Category deleted';
    } catch (error) {
      throw new NotFoundException(error.message);
    }
  }
  async getCategories(filerts: Filers) {
    const categories = await this.prismaService.category.findMany({
      where: {
        gender: filerts.gender,
      },
      select: {
        id: true,
        name: true,
        storeId: true,
        imageUrl: true,
        billboard: {
          select: {
            label: true,
          },
        },
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    if (!categories) throw new NotFoundException('Categories not found');
    return categories;
  }
}
