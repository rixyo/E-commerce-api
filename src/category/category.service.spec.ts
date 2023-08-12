import { Test, TestingModule } from '@nestjs/testing';
import { CategoryService } from './category.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { RedisService } from 'src/redis/redis.service';
describe('CategoryService', () => {
  let service: CategoryService;
  let prismaService: PrismaService;
  let redisService: RedisService;
  const mockCreateData = {
    name: 'New Category',
    billboardId: '1',
    gender: 'Male',
    imageUrl: 'src1',
  };

  const mockGetAllCategories = [
    {
      id: '1',
      name: 'New Category',
      storeId: 'store-1',
      gender: 'Female',
      imageUrl: 'src1',
      billboard: {
        id: '1',
        imageUrl: 'src1',
        label: 'New Billboard',
      },
      createdAt: '2021-08-09T08:00:00.000Z',
    },
  ];
  const mockGetData = {
    id: '1',
    name: 'New Category',
    gender: 'Male',
    imageUrl: 'src1',
    storeId: 'store-1',
    billboard: {
      id: '1',
      label: 'New Billboard',
      imageUrl: 'src1',
    },
  };
  const mockCreatedCategory = 'Category created';
  const mockStoreId = 'store-1';
  const mockPrismaCreateCategory = jest.fn();
  const mockPrismaFindUniqueCategory = jest.fn();
  const mockPrismaUpdatedCategory = jest.fn();
  const mockPrismaDeleteCategory = jest.fn();
  const mockPrismaGetCategories = jest.fn();

  const mockRedisDeleteValue = jest.fn();
  const mockRedisSetCategoryToHash = jest.fn();
  const mockRedisGetCategoryFromHash = jest.fn();
  const mockRedisGetCategoryFromList = jest.fn();
  const mockRedisSetCategoryToList = jest.fn();

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoryService,
        {
          provide: PrismaService,
          useValue: {
            category: {
              create: mockPrismaCreateCategory,
              findUnique: mockPrismaFindUniqueCategory,
              update: mockPrismaUpdatedCategory,
              delete: mockPrismaDeleteCategory,
              findMany: mockPrismaGetCategories,
            },
          },
        },
        {
          provide: RedisService,
          useValue: {
            deleteValue: mockRedisDeleteValue,
            getValueFromHash: mockRedisGetCategoryFromHash,
            setValueToHash: mockRedisSetCategoryToHash,
            getValueFromList: mockRedisGetCategoryFromList,
            setValueToList: mockRedisSetCategoryToList,
          },
        },
      ],
    }).compile();

    service = module.get<CategoryService>(CategoryService);
    prismaService = module.get<PrismaService>(PrismaService);
    redisService = module.get<RedisService>(RedisService);
  });
  afterEach(() => {
    jest.resetAllMocks();
  });
  describe('delete', () => {
    it('should delete a category', async () => {
      mockPrismaDeleteCategory.mockReturnValue('Category deleted');
      const result = await service.deleteCategory('1');
      expect(result).toEqual('Category deleted');
      expect(mockPrismaDeleteCategory).toHaveBeenCalledWith({
        where: {
          id: '1',
        },
      });
      expect(mockRedisDeleteValue).toHaveBeenCalledWith('admincategories');
      expect(mockRedisDeleteValue).toHaveBeenCalledWith('1');
    });
  });
  describe('update', () => {
    it('should update a category', async () => {
      mockPrismaUpdatedCategory.mockReturnValue('Category updated');
      const result = await service.updateCategory('1', mockCreateData);
      expect(result).toEqual('Category updated');
      expect(mockPrismaUpdatedCategory).toHaveBeenCalledWith({
        where: {
          id: '1',
        },
        data: {
          name: mockCreateData.name,
          gender: mockCreateData.gender,
          imageUrl: mockCreateData.imageUrl,
        },
      });
      expect(mockRedisDeleteValue).toHaveBeenCalledWith('admincategories');
      expect(mockRedisDeleteValue).toHaveBeenCalledWith(mockGetData.id);
    });
  });
  describe('getAll', () => {
    it('should get all categories from redis if redis is not empty', async () => {
      mockRedisGetCategoryFromList.mockReturnValue(mockGetAllCategories);
      const result = await service.getAllCategories('store-1');
      expect(result).toEqual(mockGetAllCategories);
      expect(mockRedisGetCategoryFromList).toHaveBeenCalledWith(
        'admincategories',
      );
      expect(mockPrismaGetCategories).not.toHaveBeenCalled();
    });
    it('should get all categories from redis if redis is empty', async () => {
      mockPrismaGetCategories.mockReturnValue(mockGetAllCategories);
      mockRedisGetCategoryFromList.mockReturnValue(undefined);
      const result = await service.getAllCategories('store-1');
      expect(result).toEqual(mockGetAllCategories);
      expect(mockPrismaGetCategories).toHaveBeenCalledWith({
        where: {
          storeId: 'store-1',
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
      expect(mockRedisSetCategoryToList).toHaveBeenCalledWith(
        'admincategories',
        JSON.stringify(mockGetAllCategories),
      );
    });
  });
  describe('create', () => {
    it('should create a category', async () => {
      mockPrismaCreateCategory.mockReturnValue(mockCreatedCategory);
      const result = await service.createCategory(mockCreateData, mockStoreId);
      expect(result).toEqual(mockCreatedCategory);
      expect(mockPrismaCreateCategory).toHaveBeenCalledWith({
        data: {
          name: mockCreateData.name,
          storeId: mockStoreId,
          billboardId: mockCreateData.billboardId,
          gender: mockCreateData.gender,
          imageUrl: mockCreateData.imageUrl,
        },
      });
      expect(mockRedisDeleteValue).toHaveBeenCalledWith('admincategories');
      expect(mockRedisDeleteValue).toHaveBeenCalledWith('usercategories');
    });
  });
  describe('getCategoryById', () => {
    it('should get a category from redis if redis is not empty', async () => {
      mockRedisGetCategoryFromHash.mockReturnValue(mockGetData);
      const result = await service.getCategoryById(mockGetData.id);
      expect(result).toEqual(mockGetData);
      expect(mockRedisGetCategoryFromHash).toHaveBeenCalledWith(
        mockGetData.id,
        'category',
      );
      expect(mockPrismaFindUniqueCategory).not.toHaveBeenCalled();
    });
    it('should ge a category from database if redis is empty', async () => {
      mockRedisGetCategoryFromHash.mockReturnValue(undefined);
      mockPrismaFindUniqueCategory.mockReturnValue(mockGetData);
      const result = await service.getCategoryById(mockGetData.id);
      expect(result).toEqual(mockGetData);
      expect(mockPrismaFindUniqueCategory).toHaveBeenCalledWith({
        where: { id: mockGetData.id },
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
      expect(mockRedisSetCategoryToHash).toHaveBeenCalledWith(
        mockGetData.id,
        'category',
        JSON.stringify(mockGetData),
      );
    });
  });
});
