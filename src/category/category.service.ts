import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';

interface CreateCategory {
  name: string;
  billboardId: string;
  gender: string;
  imageUrl: string;
}
interface CategoryFilter {
  gender?: string;
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
    if (categoriesFromRedis && categoriesFromRedis.length !== 0) {
      return categoriesFromRedis;
    } else {
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
      if (categories.length === 0)
        throw new NotFoundException('Categories not found');
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
  // create category
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
        select: {
          id: true,
        },
      });
      // delete category from redisCache
      Promise.all([
        this.redisService.deleteValue('menCategories'),
        this.redisService.deleteValue('womenCategories'),
        this.redisService.deleteValue('admincategories'),
      ]);
      return category;
    } catch (error) {
      throw new Error('Category not created');
    }
  }
  // update category
  async updateCategory(id: string, data: CreateCategory) {
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
      // delete category from redisCache
      Promise.all([
        this.redisService.deleteValue('admincategories'),
        this.redisService.deleteValue('menCategories'),
        this.redisService.deleteValue('womenCategories'),
        this.redisService.deleteValue(id),
      ]);
      return 'Category updated';
    } catch (error) {
      throw new Error('Category not updated');
    }
  }
  // delete category
  async deleteCategory(id: string) {
    try {
      await this.prismaService.category.delete({
        where: {
          id: id,
        },
      });
      // delete category from redisCache
      Promise.all([
        this.redisService.deleteValue('admincategories'),
        this.redisService.deleteValue('menCategories'),
        this.redisService.deleteValue('womenCategories'),
        this.redisService.deleteValue(id),
      ]);
      return 'Category deleted';
    } catch (error) {
      throw new Error('Category not deleted');
    }
  }
  // get categories for user based on gender
  async getMenCategories(storeId: string) {
    const categoriesFromRedis = await this.redisService.getValueFromList(
      'menCategories',
    );
    if (categoriesFromRedis && categoriesFromRedis.length !== 0) {
      return categoriesFromRedis;
    }
    try {
      const categories = await this.prismaService.category.findMany({
        where: {
          storeId,
          gender: 'Male',
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
      // set categories to redisCache
      await this.redisService.setValueToList(
        'menCategories',
        JSON.stringify(categories),
      );
      return categories;
    } catch (error) {
      console.log(error);
    }
  }
  async getWomenCategories(storeId: string) {
    const categoriesFromRedis = await this.redisService.getValueFromList(
      'womenCategories',
    );
    if (categoriesFromRedis && categoriesFromRedis.length !== 0) {
      return categoriesFromRedis;
    }
    try {
      const categories = await this.prismaService.category.findMany({
        where: {
          storeId,
          gender: 'Female',
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
      // set categories to redisCache
      await this.redisService.setValueToList(
        'womenCategories',
        JSON.stringify(categories),
      );
      return categories;
    } catch (error) {
      console.log(error);
    }
  }
}
