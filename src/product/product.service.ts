import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { RedisService } from 'src/redis/redis.service';
// create interface for create product
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
/// create interface for filters
interface Filters {
  price?: {
    gte?: number;
    lte?: number;
  };
  category?: {
    name: string;
  };
  sizes?: {
    value: string;
  };
  colors?: {
    value: string;
  };
  isFeatured?: boolean;
}
@Injectable()
export class ProductService {
  constructor(
    private readonly prismaService: PrismaService, // inject prisma service or create instance of prisma service
    private readonly redisService: RedisService, // inject redis service or create instance of redis service
  ) {}
  async getAllProducts(storeId: string) {
    // get products from redisCache
    const productsFromRedis = await this.redisService.getValueFromList(
      'admin-products',
    );
    if (productsFromRedis && productsFromRedis.length !== 0)
      return productsFromRedis;
    else {
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
              id: true,
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
        orderBy: {
          createdAt: 'desc',
        },
      });
      if (!products) throw new NotFoundException('Products not found');
      // set products to redisCache
      await this.redisService.setValueToList(
        'admin-products',
        JSON.stringify(products),
      );

      return products;
    }
  }
  async getProductById(id: string) {
    // get product from redisCache
    const productFromRedis = await this.redisService.getValueFromHash(
      id,
      'product',
    );
    if (productFromRedis) return productFromRedis;
    else {
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
              id: true,
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
      if (!product) throw new NotFoundException('Product not found');
      // set product to redisCache
      await this.redisService.setValueToHash(
        id,
        'product',
        JSON.stringify(product),
      );
      return product;
    }
  }
  async createProduct(body: CreateProduct, storeId: string) {
    try {
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
        this.redisService.deleteValue('admin-products'),
      ]);

      return 'Product created successfully';
    } catch (error) {
      throw new Error(error);
    }
  }
  async updateProductById(id: string, body: CreateProduct) {
    try {
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
      });
      const productColor = body.colors.map((color) => ({
        ...color,
        productId: product.id,
      }));
      const productSize = body.sizes.map((size) => ({
        ...size,
        productId: product.id,
      }));
      await Promise.all([
        this.prismaService.productColor.deleteMany({
          where: {
            productId: productColor[0].productId,
          },
        }),
        this.prismaService.productSize.deleteMany({
          where: {
            productId: productSize[0].productId,
          },
        }),
        this.prismaService.productColor.createMany({
          data: productColor,
        }),
        this.prismaService.productSize.createMany({
          data: productSize,
        }),
        this.redisService.deleteValue(id),
        this.redisService.deleteValue('admin-products'),
      ]);
      return ' Product updated successfully ';
    } catch (error) {
      throw new Error(error);
    }
  }
  async deleteProductById(id: string) {
    try {
      await this.prismaService.product.delete({
        where: {
          id: id,
        },
      });
      await Promise.all([
        this.redisService.deleteValue(id),
        this.redisService.deleteValue('admin-products'),
      ]);
      return 'Product deleted successfully';
    } catch (error) {
      throw new Error(error);
    }
  }
  async searchProduct(query: string) {
    const products = await this.prismaService.product.findMany({
      where: {
        OR: [
          {
            name: {
              contains: query,
            },
            category: {
              name: {
                contains: query,
              },
            },
          },
        ],
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
          take: 1,
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
        rewiews: {
          select: {
            rating: true,
          },
        },
      },
    });
    if (!products) return 'No products found';
    return products;
  }
  async filterProduct(filters: Filters, page: number, perPage: number) {
    const skip = (page - 1) * perPage;
    const take = parseInt(`${perPage}`);
    try {
      const products = await this.prismaService.product.findMany({
        where: filters,
        select: {
          id: true,
          name: true,
          price: true,
          description: true,
          isArchived: true,
          isFeatured: true,
          rewiews: {
            select: {
              rating: true,
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
        orderBy: {
          createdAt: 'desc',
        },
        skip: skip,
        take: take,
      });
      return products;
    } catch (error) {
      return "Can't filter products";
    }
  }
}
