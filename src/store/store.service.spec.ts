import { Test, TestingModule } from '@nestjs/testing';
import { StoreService } from './store.service';

import { NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { RedisService } from 'src/redis/redis.service';

describe('StoreService', () => {
  let service: StoreService;
  let prismaService: PrismaService;
  let redisService: RedisService;

  const mockStores = [
    { id: '1', name: 'Store 1', userId: 'user-1' },
    { id: '2', name: 'Store 2', userId: 'user-1' },
  ];
  const mockStoreDataCreate = { name: 'New Store' };
  const mockUserId = 'user-1';
  const mockStoreId = '1';
  const mockStoreData = { name: 'Updated Store' };
  const mockCreatedStore = { id: '1', name: 'New Store', userId: 'user-1' };
  const mockPrismaDeleteStore = jest.fn(); // delete store
  const mockRedisGetValueFromList = jest.fn(); // get value from list
  const mockRedisSetValueToList = jest.fn(); // set value to list
  const mockPrismaFindManyStores = jest.fn(); // findmany stores
  const mockPrismaFindFirstStore = jest.fn(); // findfirst store
  const mockRedisGetValueFromHash = jest.fn(); // get value from hash
  const mockRedisSetValueToHash = jest.fn(); // set value to hash
  const mockPrismaGetValueById = jest.fn(); // get value by id
  const mockPrismaCreateStore = jest.fn();
  const mockRedisDeleteValue = jest.fn();
  const mockPrismaUpdateStore = jest.fn();

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StoreService,
        {
          provide: PrismaService,
          useValue: {
            store: {
              findMany: mockPrismaFindManyStores,
              findFirst: mockPrismaFindFirstStore,
              mockPrismaGetValueById,
              create: mockPrismaCreateStore,
              update: mockPrismaUpdateStore,
              delete: mockPrismaDeleteStore,
            },
          },
        },
        {
          provide: RedisService,
          useValue: {
            getValueFromList: mockRedisGetValueFromList,
            setValueToList: mockRedisSetValueToList,
            getValueFromHash: mockRedisGetValueFromHash,
            setValueToHash: mockRedisSetValueToHash,
            deleteValue: mockRedisDeleteValue,
          },
        },
      ],
    }).compile();

    service = module.get<StoreService>(StoreService);
    prismaService = module.get<PrismaService>(PrismaService);
    redisService = module.get<RedisService>(RedisService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });
  it('should delete a store and delete cache values', async () => {
    await service.deleteStore(mockStoreId);

    expect(mockPrismaDeleteStore).toHaveBeenCalledWith({
      where: {
        id: '1',
      },
    });
    expect(mockRedisDeleteValue).toHaveBeenCalledWith('1');
    expect(mockRedisDeleteValue).toHaveBeenCalledWith('stores');
  });
  it('should update a store and delete cache values', async () => {
    await service.updateStore(mockStoreId, mockStoreData);

    expect(mockPrismaUpdateStore).toHaveBeenCalledWith({
      where: {
        id: '1',
      },
      data: {
        name: 'Updated Store',
      },
    });
    expect(mockRedisDeleteValue).toHaveBeenCalledWith('1');
    expect(mockRedisDeleteValue).toHaveBeenCalledWith('userFirstStore');
    expect(mockRedisDeleteValue).toHaveBeenCalledWith('stores');
  });
  describe('createStore', () => {
    it('should create a new store and delete cache values', async () => {
      mockPrismaCreateStore.mockReturnValue(mockCreatedStore);

      const result = await service.createStore(mockStoreDataCreate, mockUserId);

      expect(result).toEqual(mockCreatedStore);
      expect(mockPrismaCreateStore).toHaveBeenCalledWith({
        data: {
          name: 'New Store',
          userId: 'user-1',
        },
      });
      expect(mockRedisDeleteValue).toHaveBeenCalledWith('userFirstStore');
      expect(mockRedisDeleteValue).toHaveBeenCalledWith('stores');
    });
  });
  describe('getAllStores', () => {
    it('should return stores from Redis if available', async () => {
      mockRedisGetValueFromList.mockReturnValue(mockStores);

      const result = await service.getAllStores('user-1');

      expect(result).toEqual(mockStores);
      expect(mockRedisGetValueFromList).toHaveBeenCalledWith('stores');
      expect(mockPrismaFindManyStores).not.toHaveBeenCalled();
    });

    it('should return stores from Prisma if Redis is empty', async () => {
      mockRedisGetValueFromList.mockReturnValue([]);

      mockPrismaFindManyStores.mockReturnValue(mockStores);

      const result = await service.getAllStores('user-1');

      expect(result).toEqual(mockStores);
      expect(mockRedisGetValueFromList).toHaveBeenCalledWith('stores');
      expect(mockPrismaFindManyStores).toHaveBeenCalledWith({
        where: {
          userId: 'user-1',
        },
        select: {
          id: true,
          name: true,
          userId: true,
        },
      });
      expect(mockRedisSetValueToList).toHaveBeenCalledWith(
        'stores',
        JSON.stringify(mockStores),
      );
    });

    it('should throw NotFoundException if no stores found', async () => {
      mockRedisGetValueFromList.mockReturnValue([]);
      mockPrismaFindManyStores.mockReturnValue([]);

      await expect(service.getAllStores('user-1')).rejects.toThrowError(
        NotFoundException,
      );
    });
  });
  describe('getStoreById', () => {
    it('should return store from Redis if available', async () => {
      mockRedisGetValueFromHash.mockReturnValue(mockStores[0]);
      const result = await service.getStoreById('1');
      expect(result).toEqual(mockStores[0]);
      expect(mockRedisGetValueFromHash).toHaveBeenCalledWith(
        mockStores[0].id,
        'store',
      );
    });
    it('should return store from Prisma if Redis is empty', async () => {
      mockRedisGetValueFromHash.mockReturnValue(undefined);

      mockPrismaFindFirstStore.mockReturnValue(mockStores[0]);

      const result = await service.getStoreById('1');

      expect(result).toEqual(mockStores[0]);
      expect(mockRedisGetValueFromHash).toHaveBeenCalledWith('1', 'store');
      expect(mockPrismaFindFirstStore).toHaveBeenCalledWith({
        where: {
          id: '1',
        },
        select: {
          id: true,
          name: true,
          userId: true,
        },
      });
      expect(mockRedisSetValueToHash).toHaveBeenCalledWith(
        '1',
        'store',
        JSON.stringify(mockStores[0]),
      );
    });
  });
  describe('getFirstStore', () => {
    it('should return store from Redis if available', async () => {
      mockRedisGetValueFromHash.mockReturnValue(mockStores[0]); // get value from hash
      const result = await service.getStoreByUserId('user-1'); // getFirstStore
      expect(result).toEqual(mockStores[0]);
      expect(mockRedisGetValueFromHash).toHaveBeenCalledWith(
        'userFirstStore',
        'userStore',
      );
    });
    it('should return store from Prisma if Redis is empty', async () => {
      mockRedisGetValueFromHash.mockReturnValue(undefined);

      mockPrismaFindFirstStore.mockReturnValue(mockStores[0]);

      const result = await service.getStoreByUserId('user-1');

      expect(result).toEqual(mockStores[0]);
      expect(mockRedisGetValueFromHash).toHaveBeenCalledWith(
        'userFirstStore',
        'userStore',
      );
      expect(mockPrismaFindFirstStore).toHaveBeenCalledWith({
        where: {
          userId: 'user-1',
        },
        select: {
          id: true,
          userId: true,
          name: true,
        },
      });
      expect(mockRedisSetValueToHash).toHaveBeenCalledWith(
        'userFirstStore',
        'userStore',
        JSON.stringify(mockStores[0]),
      );
    });
  });
});
