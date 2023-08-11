import { Test, TestingModule } from '@nestjs/testing';
import { SizeService } from './size.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { RedisService } from 'src/redis/redis.service';
import exp from 'constants';

describe('SizeService', () => {
  let service: SizeService;
  let prismaService: PrismaService;
  let redisService: RedisService;
  const mockCreateData = { name: 'New Size', value: 'New Value' };
  const mockCreatedSize = 'Create size successfully';
  const mockStoreId = 'store-1';
  const mockPrismaCreateSize = jest.fn();
  const mockRedisDeleteValue = jest.fn();

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SizeService,
        {
          provide: PrismaService,
          useValue: {
            size: {
              create: mockPrismaCreateSize,
            },
          },
        },
        {
          provide: RedisService,
          useValue: {
            deleteValue: mockRedisDeleteValue,
          },
        },
      ],
    }).compile();

    service = module.get<SizeService>(SizeService);
    prismaService = module.get<PrismaService>(PrismaService);
    redisService = module.get<RedisService>(RedisService);
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
      expect(mockRedisDeleteValue).toHaveBeenCalledWith('usersizes');
    });
  });
});
