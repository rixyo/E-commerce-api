import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { RedisService } from 'src/redis/redis.service';

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
    if (!categoriesFromCache) {
      const categories = await this.prismaService.category.findMany({
        where: {
          storeId: storeId,
        },
        select: {
          id: true,
          name: true,
          storeId: true,
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
          storeId: true,
          billboard: {
            select: {
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
  async createCategory(name: string, storeId: string, billboardId: string) {
    const category = await this.prismaService.category.create({
      data: {
        name: name,
        storeId: storeId,
        billboardId: billboardId,
      },
      select: {
        id: true,
        name: true,
        storeId: true,
        billboard: {
          select: {
            label: true,
          },
        },
        createdAt: true,
      },
    });
    await Promise.all([
      this.redisService.setValue(category.id, JSON.stringify(category)),
      this.redisService.setValue(`getAllCategories+${storeId}`, null),
    ]);
    return category;
  }
  async updateCategoryById(id: string, name: string) {
    const category = await this.prismaService.category.update({
      where: {
        id: id,
      },
      data: {
        name: name,
      },
      select: {
        id: true,
        name: true,
        storeId: true,
        billboard: {
          select: {
            label: true,
          },
        },
        createdAt: true,
      },
    });
    await Promise.all([
      this.redisService.setValue(`getAllCategories+${category.storeId}`, null),
      this.redisService.setValue(id, JSON.stringify(category)),
    ]);
    return category;
  }
  async deleteCategoryById(id: string) {
    const category = await this.prismaService.category.delete({
      where: {
        id: id,
      },
      select: {
        id: true,
        name: true,
        storeId: true,
        billboard: {
          select: {
            label: true,
          },
        },
        createdAt: true,
      },
    });
    await Promise.all([
      await this.redisService.deleteValue(id),
      await this.redisService.deleteValue(
        `getAllCategories+${category.storeId}`,
      ),
    ]);
    return 'Category deleted';
  }
  async getCategories() {
    const categoriesFromCache = await this.redisService.getValue(
      ' categories ',
    );
    if (!categoriesFromCache || categoriesFromCache === 'null') {
      const categories = await this.prismaService.category.findMany({
        select: {
          id: true,
          name: true,
          storeId: true,
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
      await this.redisService.setValue(
        ' categories ',
        JSON.stringify(categories),
      );
      return categories;
    }
    return JSON.parse(categoriesFromCache);
  }
}
