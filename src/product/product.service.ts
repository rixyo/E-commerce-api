import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { RedisService } from 'src/redis/redis.service';

interface CreateProduct {
  name: string;
  price: number;
  categoryId: string;
  images: { url: string }[];
  colors: { value: string }[];
  sizes: { value: string }[];
  description: string;
}
@Injectable()
export class ProductService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly redisService: RedisService,
  ) {}
  async getAllProducts(storeId: string, page: number, perPage: number) {
    const productsFromCache = await this.redisService.getValue(
      `getAllProducts+${storeId}`,
    );
    if (productsFromCache === 'null' || !productsFromCache) {
      const skip = (page - 1) * perPage;
      const take = parseInt(`${perPage}`);
      const products = await this.prismaService.product.findMany({
        where: {
          storeId: storeId,
        },
        select: {
          id: true,
          name: true,
          price: true,
          description: true,
          createdAt: true,
          category: {
            select: {
              name: true,
            },
          },
          Images: {
            select: {
              id: true,
              url: true,
            },
            take: 1,
          },
          Sizes: {
            select: {
              value: true,
            },
          },
          Colors: {
            select: {
              value: true,
            },
          },
        },
        skip: skip,
        take: take,
        orderBy: {
          createdAt: 'desc',
        },
      });
      await this.redisService.setValue(
        `getAllProducts+${storeId}`,
        JSON.stringify(products),
      );
      return products;
    }
    return JSON.parse(productsFromCache);
  }
  async getProductById(id: string) {
    const productFromCache = await this.redisService.getValue(id);
    if (!productFromCache || productFromCache === 'null') {
      const product = await this.prismaService.product.findUnique({
        where: {
          id: id,
        },
        select: {
          id: true,
          name: true,
          price: true,
          storeId: true,
          createdAt: true,
          category: {
            select: {
              name: true,
            },
          },
          Images: {
            select: {
              id: true,
              url: true,
            },
          },
          Sizes: {
            select: {
              value: true,
            },
          },
          Colors: {
            select: {
              value: true,
            },
          },
        },
      });
      await this.redisService.setValue(id, JSON.stringify(product));
      return product;
    }
    return JSON.parse(productFromCache);
  }
  async createProduct(body: CreateProduct, storeId: string) {
    const product = await this.prismaService.product.create({
      data: {
        name: body.name,
        price: body.price.toFixed(2),
        storeId: storeId,
        categoryId: body.categoryId,
        description: body.description,
      },
    });
    const productImage = body.images.map((image) => ({
      ...image,
      productId: product.id,
    }));
    const productColor = body.colors.map((color) => ({
      ...color,
      productId: product.id,
    }));
    const productSize = body.sizes.map((size) => ({
      ...size,
      productId: product.id,
    }));
    await this.prismaService.image.createMany({
      data: productImage,
    });
    await this.prismaService.productColor.createMany({
      data: productColor,
    });
    await this.prismaService.productSize.createMany({
      data: productSize,
    });
    const updatedRedis = await this.getProductById('null');
    await this.redisService.setValue(product.id, JSON.stringify(updatedRedis));
    await this.redisService.setValue(`getAllProducts+${storeId}`, 'null');
    return 'Product created successfully';
  }
  async updateProductById(id: string, body: CreateProduct) {
    const product = await this.prismaService.product.update({
      where: {
        id: id,
      },
      data: {
        name: body.name,
        price: body.price.toFixed(2),
        categoryId: body.categoryId,
      },
    });
    await this.redisService.setValue(id, JSON.stringify(product));
    await this.redisService.setValue(
      `getAllProducts+${product.storeId}`,
      'null',
    );
  }
  async deleteProductById(id: string) {
    const product = await this.prismaService.product.delete({
      where: {
        id: id,
      },
    });
    await this.redisService.deleteValue(id);
    await this.redisService.deleteValue(`getAllProducts+${product.storeId}`);
    return 'Product deleted successfully';
  }
}
