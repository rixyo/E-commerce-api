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
    private readonly prismaService: PrismaService, // inject prisma service or create instance of prisma service
    private readonly redisService: RedisService, // inject redis service or create instance of redis service
  ) {}
  async getAllCategories(storeId: string) {
    // get categories from redisCache
    const categoriesFromRedis = await this.redisService.getValueFromList(
      'admincategories',
    );
    if (categoriesFromRedis && categoriesFromRedis.length !== 0)
      return categoriesFromRedis;
    else {
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
              imageUrl: true,
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
      // set categories to redisCache
      await this.redisService.setValueToList(
        'admincategories',
        JSON.stringify(categories),
      );
      return categories;
    }
  }
  async getCategoryById(id: string) {
    // get category from redisCache
    const categoryFromRedis = await this.redisService.getValueFromHash(
      id,
      'category',
    );
    if (categoryFromRedis) return categoryFromRedis;
    else {
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
              imageUrl: true,
            },
          },
        },
      });
      if (!category) throw new NotFoundException('Category not found');
      // set category to redisCache
      await this.redisService.setValueToHash(
        id,
        'category',
        JSON.stringify(category),
      );
      return category;
    }
  }
  async createCategory(data: CreateCategory, storeId: string) {
    try {
      await this.prismaService.category.create({
        data: {
          name: data.name,
          storeId: storeId,
          billboardId: data.billboardId,
          gender: data.gender,
          imageUrl: data.imageUrl,
        },
      });
      await this.redisService.deleteValue('admincategories');
      await this.redisService.deleteValue('usercategories');
      return 'Category created';
    } catch (error) {
      throw new Error('Category not created');
    }
  }
  async updateCategoryById(id: string, data: CreateCategory) {
    try {
      await this.prismaService.category.update({
        where: {
          id: id,
        },
        data: {
          name: data.name,
          gender: data.gender,
          imageUrl: data.imageUrl,
        },
      });
      Promise.all([
        this.redisService.deleteValue('admincategories'),
        this.redisService.deleteValue(id),
      ]);
      return 'Category updated';
    } catch (error) {
      throw new Error('Category not updated');
    }
  }
  async deleteCategoryById(id: string) {
    try {
      await this.prismaService.category.delete({
        where: {
          id: id,
        },
      });
      Promise.all([
        this.redisService.deleteValue('admincategories'),
        this.redisService.deleteValue(id),
      ]);
      return 'Category deleted';
    } catch (error) {
      throw new Error('Category not deleted');
    }
  }
  async getCategories(filerts: Filers) {
    try {
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
    } catch (error) {
      console.log(error);
      return 'Categories not found';
    }
  }
}
