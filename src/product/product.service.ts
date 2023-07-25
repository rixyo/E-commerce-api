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
  isFeatured: boolean;
  isArchived: boolean;
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
    if (!productsFromCache) {
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
          isArchived: true,
          isFeatured: true,
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
    return productsFromCache;
  }
  async getProductById(id: string) {
    const productFromCache = await this.redisService.getValue(id);
    if (!productFromCache) {
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
          description: true,
          isArchived: true,
          isFeatured: true,
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
    return productFromCache;
  }
  async createProduct(body: CreateProduct, storeId: string) {
    const product = await this.prismaService.product.create({
      data: {
        name: body.name,
        price: body.price.toFixed(2),
        storeId: storeId,
        categoryId: body.categoryId,
        description: body.description,
        isArchived: body.isArchived,
        isFeatured: body.isFeatured,
      },
      select: {
        id: true,
        name: true,
        price: true,
        description: true,
        isArchived: true,
        isFeatured: true,
        Images: {
          select: {
            id: true,
            url: true,
          },
        },
        Sizes: {
          select: {
            id: true,
            value: true,
          },
        },
        Colors: {
          select: {
            id: true,
            value: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
          },
        },
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
    await Promise.all([
      this.prismaService.image.createMany({
        data: productImage,
      }),
      this.prismaService.productColor.createMany({
        data: productColor,
      }),
      this.prismaService.productSize.createMany({
        data: productSize,
      }),
      this.redisService.setValue(product.id, JSON.stringify(product)),
      this.redisService.setValue(`getAllProducts+${storeId}`, 'null'),
    ]);

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
        description: body.description,
        isArchived: body.isArchived,
        isFeatured: body.isFeatured,
      },
      select: {
        id: true,
        name: true,
        storeId: true,
        price: true,
        description: true,
        isArchived: true,
        isFeatured: true,
        Images: {
          select: {
            id: true,
            url: true,
          },
        },
        Sizes: {
          select: {
            id: true,
            value: true,
          },
        },
        Colors: {
          select: {
            id: true,
            value: true,
          },
        },
      },
    });
    await Promise.all([
      this.redisService.setValue(id, JSON.stringify(product)),
      this.redisService.setValue(`getAllProducts+${product.storeId}`, 'null'),
    ]);
  }
  async deleteProductById(id: string) {
    const product = await this.prismaService.product.delete({
      where: {
        id: id,
      },
    });
    await Promise.all([
      this.redisService.deleteValue(id),
      this.redisService.deleteValue(`getAllProducts+${product.storeId}`),
    ]);
    return 'Product deleted successfully';
  }
}
