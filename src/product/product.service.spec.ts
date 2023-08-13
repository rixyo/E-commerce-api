import { Test, TestingModule } from '@nestjs/testing';
import { ProductService } from './product.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { RedisService } from 'src/redis/redis.service';

describe('ProductService', () => {
  let service: ProductService;
  let prismaService: PrismaService;
  let redisService: RedisService;
  const createImageData = [
    {
      url: 'src1',
    },
  ];
  const createProductSizeData = [
    {
      value: 'S',
    },
  ];
  const createProductColorData = [
    {
      value: 'Red',
    },
  ];
  const mockGetValue = {
    id: '1',
    name: 'New Product',
    price: '100',
    storeId: 'store-1',
    createdAt: '2021-08-09T08:00:00.000Z',
    description: 'New Description',
    isArchived: false,
    isFeatured: false,
    category: {
      id: 'category-1',
      name: 'New Category',
    },
    Images: [
      {
        id: 'image-1',
        url: 'src1',
      },
    ],
    Sizes: [
      {
        value: 'S',
      },
    ],
    Colors: [
      {
        value: 'Red',
      },
    ],
  };
  const createProductData = {
    name: 'New Product',
    price: '100',
    categoryId: 'category-1',
    images: createImageData,
    colors: createProductColorData,
    sizes: createProductSizeData,
    description: 'New Description',
    isArchived: false,
    isFeatured: false,
  };
  const filter = {
    category: {
      name: 'New Category',
    },
  };
  const mockPrismaCreateProduct = jest.fn();
  const mockPrismaFindUniqueProduct = jest.fn();
  const mockPrismaCreateImage = jest.fn();
  const mockPrismaCreateProductSize = jest.fn();
  const mockPrismaCreateProductColor = jest.fn();
  const mockGetAllProductsBasedOnFilter = jest.fn();
  const mockGetAllProductsBasedOnSearch = jest.fn();
  const mockPrismaUpdatedProduct = jest.fn();
  const mockPrismaDeleteProductSize = jest.fn();
  const mockPrismaDeleteProductColor = jest.fn();

  const mockRedisSetValueToHash = jest.fn();
  const mockRedisGetValueFromHash = jest.fn();
  const mockRedisDeleteValue = jest.fn();

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductService,
        {
          provide: PrismaService,
          useValue: {
            product: {
              create: mockPrismaCreateProduct,
              findUnique: mockPrismaFindUniqueProduct,
              findMany: mockGetAllProductsBasedOnFilter,
              mockGetAllProductsBasedOnSearch,
              update: mockPrismaUpdatedProduct,
            },
            image: {
              createMany: mockPrismaCreateImage,
            },
            productSize: {
              createMany: mockPrismaCreateProductSize,
              deleteMane: mockPrismaDeleteProductSize,
            },
            productColor: {
              createMany: mockPrismaCreateProductColor,
              deleteMany: mockPrismaDeleteProductColor,
            },
          },
        },
        {
          provide: RedisService,
          useValue: {
            deleteValue: mockRedisDeleteValue,
            setValueToHash: mockRedisSetValueToHash,
            getValueFromHash: mockRedisGetValueFromHash,
          },
        },
      ],
    }).compile();

    service = module.get<ProductService>(ProductService);
    prismaService = module.get<PrismaService>(PrismaService);
    redisService = module.get<RedisService>(RedisService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });
  describe('filterProduct', () => {
    const skip = (1 - 1) * 10;
    const take = parseInt(`${10}`);
    it('should get all products based on filter', async () => {
      mockGetAllProductsBasedOnFilter.mockReturnValue([mockGetValue]);
      const result = await service.filterProducts('store-1', filter, 1, 10);
      expect(result).toEqual([mockGetValue]);
      expect(mockGetAllProductsBasedOnFilter).toHaveBeenCalledWith({
        where: {
          storeId: 'store-1',
          ...filter,
        },
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
    });
  });
  describe('getById', () => {
    it('should get a product by id if redis is not empty', async () => {
      mockRedisGetValueFromHash.mockReturnValue(mockGetValue);
      const result = await service.getProductById(mockGetValue.id);
      expect(result).toEqual(mockGetValue);
      expect(mockRedisGetValueFromHash).toHaveBeenCalledWith(
        mockGetValue.id,
        'product',
      );
    });
    it('should get a product by id if redis is empty', async () => {
      mockRedisGetValueFromHash.mockReturnValue(undefined);
      mockPrismaFindUniqueProduct.mockReturnValue(mockGetValue);
      const result = await service.getProductById(mockGetValue.id);
      expect(result).toEqual(mockGetValue);
      expect(mockPrismaFindUniqueProduct).toHaveBeenCalledWith({
        where: {
          id: mockGetValue.id,
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
      expect(mockRedisSetValueToHash).toHaveBeenCalledWith(
        mockGetValue.id,
        'product',
        JSON.stringify(mockGetValue),
      );
    });
  });
  describe('createProduct', () => {
    it('should create a product', async () => {
      mockPrismaCreateProduct.mockReturnValue('product-1');
      const result = await service.createProduct(createProductData, 'store-1');
      expect(result).toEqual('product-1');
      expect(mockPrismaCreateProduct).toHaveBeenCalledWith({
        data: {
          name: createProductData.name,
          price: createProductData.price,
          storeId: 'store-1',
          categoryId: createProductData.categoryId,
          description: createProductData.description,
          isArchived: createProductData.isArchived,
          isFeatured: createProductData.isFeatured,
        },
        select: {
          id: true,
        },
      });

      expect(mockRedisDeleteValue).toHaveBeenCalledWith('admin-products');
    });
  });
});
