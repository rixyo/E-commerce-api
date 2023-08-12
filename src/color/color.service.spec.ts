import { Test, TestingModule } from '@nestjs/testing';
import { ColorService } from './color.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { RedisService } from 'src/redis/redis.service';
import { mock } from 'node:test';
describe('ColorService', () => {
  let service: ColorService;
  let prismaService: PrismaService;
  let redisService: RedisService;
  const mockCreateData = { name: 'New Color', value: 'New Value' };
  const mockGetValue = {
    id: '1',
    name: 'New Color',
    storeId: 'store-1',
    value: 'New Value',
  };
  const mockGetAllValues = [
    {
      id: '1',
      name: 'New Color',
      storeId: 'store-1',
      value: 'New Value',
      createdAt: '2021-08-09T08:00:00.000Z',
    },
  ];
  const mockCreatedColor = 'Create color successfully';
  const mockStoreId = 'store-1';
  const mockPrismaCreateColor = jest.fn();
  const mockGetColorById = jest.fn();
  const mockPrismaGetAllColors = jest.fn();
  const mockPrismaUpdateColor = jest.fn();
  const mockPrismaDeleteColor = jest.fn();

  const mockRedisDeleteValue = jest.fn();
  const mockRedisSetValueToHash = jest.fn();
  const mockRedisGetValueFromHash = jest.fn();
  const mockRedisGetValueFromList = jest.fn();
  const mockRedisSetValueToList = jest.fn();

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ColorService,
        {
          provide: PrismaService,
          useValue: {
            color: {
              create: mockPrismaCreateColor,
              findUnique: mockGetColorById,
              findMany: mockPrismaGetAllColors,
              update: mockPrismaUpdateColor,
              delete: mockPrismaDeleteColor,
            },
          },
        },
        {
          provide: RedisService,
          useValue: {
            deleteValue: mockRedisDeleteValue,
            setValueToHash: mockRedisSetValueToHash,
            getValueFromHash: mockRedisGetValueFromHash,
            getValueFromList: mockRedisGetValueFromList,
            setValueToList: mockRedisSetValueToList,
          },
        },
      ],
    }).compile();

    service = module.get<ColorService>(ColorService);
    prismaService = module.get<PrismaService>(PrismaService);
    redisService = module.get<RedisService>(RedisService);
  });
  afterEach(() => {
    jest.resetAllMocks();
  });
  describe('delete', () => {
    it('should delete color successfully', async () => {
      mockPrismaDeleteColor.mockReturnValue('Delete color successfully');
      const result = await service.deleteColor('1');
      expect(result).toEqual('Delete color successfully');
      expect(mockPrismaDeleteColor).toHaveBeenCalledWith({
        where: {
          id: '1',
        },
      });
      expect(mockRedisDeleteValue).toHaveBeenCalledWith('colors');
      expect(mockRedisDeleteValue).toHaveBeenCalledWith('1');
    });
  });
  describe('update', () => {
    it('should update color successfully', async () => {
      mockPrismaUpdateColor.mockReturnValue('Update color successfully');
      const result = await service.updateColor('1', mockCreateData);
      expect(result).toEqual('Update color successfully');
      expect(mockPrismaUpdateColor).toHaveBeenCalledWith({
        where: { id: '1' },
        data: {
          name: mockCreateData.name,
          value: mockCreateData.value,
        },
      });
      expect(mockRedisDeleteValue).toHaveBeenCalledWith('colors');
      expect(mockRedisDeleteValue).toHaveBeenCalledWith('1');
    });
  });
  describe('getAll', () => {
    it('should get all colors if redis is not empty', async () => {
      mockRedisGetValueFromList.mockReturnValue(mockGetAllValues);
      const result = await service.getAllColors('store-1');
      expect(result).toEqual(mockGetAllValues);
      expect(mockPrismaGetAllColors).not.toHaveBeenCalled();
      expect(mockRedisGetValueFromList).toHaveBeenCalledWith('colors');
    });
    it('should get all colors if redis is  empty', async () => {
      mockRedisGetValueFromList.mockReturnValue(undefined);
      mockPrismaGetAllColors.mockReturnValue(mockGetAllValues);
      const result = await service.getAllColors('store-1');
      expect(result).toEqual(mockGetAllValues);
      expect(mockPrismaGetAllColors).toHaveBeenCalledWith({
        where: { storeId: 'store-1' },
        select: {
          id: true,
          name: true,
          storeId: true,
          value: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      });
      expect(mockRedisSetValueToList).toHaveBeenCalledWith(
        'colors',
        JSON.stringify(mockGetAllValues),
      );
    });
  });
  describe('getById', () => {
    it('should get a color by id if redis is not empty', async () => {
      mockRedisGetValueFromHash.mockReturnValue(mockGetValue);
      const result = await service.getColorById(mockGetValue.id);
      expect(result).toEqual(mockGetValue);
      expect(mockRedisGetValueFromHash).toHaveBeenCalledWith(
        mockGetValue.id,
        'color',
      );
    });
    it('should get a color by id if redis is empty', async () => {
      mockGetColorById.mockReturnValue(mockGetValue);
      mockRedisGetValueFromHash.mockReturnValue(undefined);
      const result = await service.getColorById(mockGetValue.id);
      expect(result).toEqual(mockGetValue);
      expect(mockGetColorById).toHaveBeenCalledWith({
        where: {
          id: mockGetValue.id,
        },
        select: {
          id: true,
          name: true,
          storeId: true,
          value: true,
        },
      });
      expect(mockRedisSetValueToHash).toHaveBeenCalledWith(
        mockGetValue.id,
        'color',
        JSON.stringify(mockGetValue),
      );
    });
  });
  describe('create', () => {
    it('should create a color', async () => {
      mockPrismaCreateColor.mockReturnValue(mockCreatedColor);
      const result = await service.createColor(mockCreateData, mockStoreId);
      expect(result).toEqual(mockCreatedColor);
      expect(mockPrismaCreateColor).toHaveBeenCalledWith({
        data: {
          name: mockCreateData.name,
          value: mockCreateData.value,
          storeId: mockStoreId,
        },
        select: {
          id: true,
        },
      });
      expect(mockRedisDeleteValue).toHaveBeenCalledWith('colors');
    });
  });
});
