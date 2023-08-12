import { Test, TestingModule } from '@nestjs/testing';
import { SizeService } from './size.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { RedisService } from 'src/redis/redis.service';

describe('SizeService', () => {
  let service: SizeService;
  let prismaService: PrismaService;
  let redisService: RedisService;
  const mockCreateData = { name: 'New Size', value: 'New Value' };
  const mockSizes = [
    {
      id: 'size-1',
      name: 'New Size',
      value: 'New Value',
      storeId: 'store-1',
      createdAt: '2021-08-09T08:00:00.000Z',
    },
  ];
  const mockCreatedSize = 'Create size successfully';
  const mockStoreId = 'store-1';
  const mockPrismaCreateSize = jest.fn();
  const mockPrismaGetAllSizes = jest.fn();
  const mockPrismaFindUniqueSize = jest.fn();
  const mockPrismaUpdateSize = jest.fn();
  const mockPrismaDeleteSize = jest.fn();

  const mockRedisDeleteValue = jest.fn();
  const mockRedisSetValueToList = jest.fn();
  const mockRedisGetValueFromList = jest.fn();
  const mockRedisSetValueToHash = jest.fn();
  const mockRedisGetValueFromHash = jest.fn();

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SizeService,
        {
          provide: PrismaService,
          useValue: {
            size: {
              create: mockPrismaCreateSize,
              findMany: mockPrismaGetAllSizes,
              findUnique: mockPrismaFindUniqueSize,
              update: mockPrismaUpdateSize,
              delete: mockPrismaDeleteSize,
            },
          },
        },
        {
          provide: RedisService,
          useValue: {
            deleteValue: mockRedisDeleteValue,
            setValueToList: mockRedisSetValueToList,
            getValueFromList: mockRedisGetValueFromList,
            setValueToHash: mockRedisSetValueToHash,
            getValueFromHash: mockRedisGetValueFromHash,
          },
        },
      ],
    }).compile();

    service = module.get<SizeService>(SizeService);
    prismaService = module.get<PrismaService>(PrismaService);
    redisService = module.get<RedisService>(RedisService);
  });
  describe('deleteSize', () => {
    it('should delete size successfully', async () => {
      mockPrismaDeleteSize.mockReturnValue('Delete size successfully');
      const result = await service.deleteSize(mockSizes[0].id);
      expect(result).toEqual('Delete size successfully');
      expect(mockPrismaDeleteSize).toHaveBeenCalledWith({
        where: {
          id: mockSizes[0].id,
        },
      });
      expect(mockRedisDeleteValue).toHaveBeenCalledWith('sizes');
      expect(mockRedisDeleteValue).toHaveBeenCalledWith(mockSizes[0].id);
    });
  });
  describe('updateSize', () => {
    it('should update size successfully', async () => {
      mockPrismaUpdateSize.mockReturnValue('Update size successfully');
      const result = await service.updateSize(mockSizes[0].id, mockCreateData);
      expect(result).toEqual('Update size successfully');
      expect(mockPrismaUpdateSize).toHaveBeenCalledWith({
        where: {
          id: mockSizes[0].id,
        },
        data: {
          name: mockCreateData.name,
          value: mockCreateData.value,
        },
      });
      expect(mockRedisDeleteValue).toHaveBeenCalledWith('sizes');
      expect(mockRedisDeleteValue).toHaveBeenCalledWith(mockSizes[0].id);
    });
  });
  describe('getSizeById', () => {
    it('should return size if cached is not empty', async () => {
      mockRedisGetValueFromHash.mockReturnValue(mockSizes[0]);
      const result = await service.getSizeById(mockSizes[0].id);
      expect(result).toEqual(mockSizes[0]);
      expect(mockRedisGetValueFromHash).toHaveBeenCalledWith(
        mockSizes[0].id,
        'size',
      );
      expect(mockPrismaFindUniqueSize).not.toHaveBeenCalled();
    });
    it('should return size if cached is empty', async () => {
      mockPrismaFindUniqueSize.mockReturnValue(mockSizes[0]);
      mockRedisGetValueFromHash.mockReturnValue(undefined);
      const result = await service.getSizeById(mockSizes[0].id);
      expect(result).toEqual(mockSizes[0]);
      expect(mockPrismaFindUniqueSize).toHaveBeenCalledWith({
        where: {
          id: mockSizes[0].id,
        },
        select: {
          id: true,
          name: true,
          storeId: true,
          value: true,
        },
      });
      expect(mockRedisSetValueToHash).toHaveBeenCalledWith(
        mockSizes[0].id,
        'size',
        JSON.stringify(mockSizes[0]),
      );
    });
  });
  describe('getAll', () => {
    it('should return all sizes it redis is not empty', async () => {
      mockRedisGetValueFromList.mockReturnValue(mockSizes);
      const result = await service.getAllSizes(mockStoreId);
      expect(result).toEqual(mockSizes);
      expect(mockRedisGetValueFromList).toHaveBeenCalledWith('sizes');
      expect(mockPrismaGetAllSizes).not.toHaveBeenCalled();
    });
    it('should return all sizes it redis is empty', async () => {
      mockPrismaGetAllSizes.mockReturnValue(mockSizes);
      mockRedisGetValueFromList.mockReturnValue(undefined);
      const result = await service.getAllSizes(mockStoreId);
      expect(result).toEqual(mockSizes);
      expect(mockPrismaGetAllSizes).toHaveBeenCalledWith({
        where: {
          storeId: mockStoreId,
        },
        select: {
          id: true,
          name: true,
          value: true,
          storeId: true,
          createdAt: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
      expect(mockRedisSetValueToList).toHaveBeenCalledWith(
        'sizes',
        JSON.stringify(mockSizes),
      );
    });
  });
  describe('create', () => {
    it('should create a size', async () => {
      mockPrismaCreateSize.mockReturnValue(mockCreatedSize);
      const result = await service.createSize(mockCreateData, mockStoreId);
      expect(result).toEqual(mockCreatedSize);
      expect(mockPrismaCreateSize).toHaveBeenCalledWith({
        data: {
          name: mockCreateData.name,
          value: mockCreateData.value,
          storeId: mockStoreId,
        },
      });
      expect(mockRedisDeleteValue).toHaveBeenCalledWith('sizes');
    });
  });
});
