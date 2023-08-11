import { Test, TestingModule } from '@nestjs/testing';
import { ColorService } from './color.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { RedisService } from 'src/redis/redis.service';

describe('ColorService', () => {
  let service: ColorService;
  let prismaService: PrismaService;
  let redisService: RedisService;
  const mockCreateData = { name: 'New Color', value: 'New Value' };
  const mockCreatedColor = 'Create color successfully';
  const mockStoreId = 'store-1';
  const mockPrismaCreateColor = jest.fn();
  const mockRedisDeleteValue = jest.fn();

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ColorService,
        {
          provide: PrismaService,
          useValue: {
            color: {
              create: mockPrismaCreateColor,
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

    service = module.get<ColorService>(ColorService);
    prismaService = module.get<PrismaService>(PrismaService);
    redisService = module.get<RedisService>(RedisService);
  });
  afterEach(() => {
    jest.resetAllMocks();
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
