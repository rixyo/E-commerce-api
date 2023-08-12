import { Test, TestingModule } from '@nestjs/testing';
import { BillboardService } from './billboard.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { RedisService } from 'src/redis/redis.service';
describe('BillboardService', () => {
  let service: BillboardService;
  let prismaService: PrismaService;
  let redisService: RedisService;
  const mockCreateData = { label: 'New Billboard', imageUrl: 'New Value' };
  const mockGetBillboard = {
    id: '12345',
    label: 'New Billboard',
    imageUrl: 'New Value',
  };
  const getAllBillboards = [
    {
      id: '12345',
      label: 'New Billboard',
      imageUrl: 'New Value',
      createdAt: '2021-08-02T08:00:00.000Z',
    },
  ];
  const mockCreatedBillboard = 'Billboard created successfully';
  const mockStoreId = 'store-1';
  const mockPrismaCreateBillboard = jest.fn();
  const mockPrismaGetBillboardById = jest.fn();
  const mockPrismaUpdatedBillboard = jest.fn();
  const mockPrismaDeleteBillboard = jest.fn();
  const mockPrismaGetBillboards = jest.fn();

  const mockRedisDeleteValue = jest.fn();
  const mockRedisGetValueFromHash = jest.fn();
  const mockRedisSetValueToHash = jest.fn();
  const mockRedisGetValueFromList = jest.fn();
  const mockRedisSetValueToList = jest.fn();

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BillboardService,
        {
          provide: PrismaService,
          useValue: {
            billboard: {
              create: mockPrismaCreateBillboard,
              findUnique: mockPrismaGetBillboardById,
              update: mockPrismaUpdatedBillboard,
              delete: mockPrismaDeleteBillboard,
              findMany: mockPrismaGetBillboards,
            },
          },
        },
        {
          provide: RedisService,
          useValue: {
            deleteValue: mockRedisDeleteValue,
            getValueFromHash: mockRedisGetValueFromHash,
            setValueToHash: mockRedisSetValueToHash,
            getValueFromList: mockRedisGetValueFromList,
            setValueToList: mockRedisSetValueToList,
          },
        },
      ],
    }).compile();

    service = module.get<BillboardService>(BillboardService);
    prismaService = module.get<PrismaService>(PrismaService);
    redisService = module.get<RedisService>(RedisService);
  });
  afterEach(() => {
    jest.resetAllMocks();
  });
  describe('getAll', () => {
    it('should get all billboards if redis is empty', async () => {
      mockRedisGetValueFromList.mockReturnValue(null);
      mockPrismaGetBillboards.mockReturnValue(getAllBillboards);
      const result = await service.getAllBillboards(mockStoreId);
      expect(result).toEqual(getAllBillboards);
      expect(mockPrismaGetBillboards).toHaveBeenCalledWith({
        where: { storeId: mockStoreId },
        select: {
          id: true,
          label: true,
          imageUrl: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      });
      expect(mockRedisSetValueToList).toHaveBeenCalledWith(
        'billboards',
        JSON.stringify(getAllBillboards),
      );
    });
    it('should get all billboards if redis is not empty', async () => {
      mockRedisGetValueFromList.mockReturnValue(getAllBillboards);
      const result = await service.getAllBillboards(mockStoreId);
      expect(result).toEqual(getAllBillboards);
      expect(mockRedisGetValueFromList).toHaveBeenCalledWith('billboards');
      expect(mockPrismaGetBillboards).not.toHaveBeenCalled();
    });
  });
  describe('delete', () => {
    it('should delete a billboard', async () => {
      mockPrismaDeleteBillboard.mockReturnValue('deleted successfully');
      const result = await service.deleteBillboardById(mockGetBillboard.id);
      expect(result).toEqual('deleted successfully');
      expect(mockPrismaDeleteBillboard).toHaveBeenCalledWith({
        where: { id: mockGetBillboard.id },
      });
      expect(mockRedisDeleteValue).toHaveBeenCalledWith('billboards');
      expect(mockRedisDeleteValue).toHaveBeenCalledWith('usersbillboard');
    });
  });
  describe('update', () => {
    it('should update a billboard', async () => {
      mockPrismaUpdatedBillboard.mockReturnValue('updated successfully');
      const result = await service.updateBillboardById(
        mockGetBillboard.id,
        mockCreateData,
      );
      expect(result).toEqual('updated successfully');
      expect(mockPrismaUpdatedBillboard).toHaveBeenCalledWith({
        where: { id: mockGetBillboard.id },
        data: {
          label: mockCreateData.label,
          imageUrl: mockCreateData.imageUrl,
        },
      });
      expect(mockRedisDeleteValue).toHaveBeenCalledWith('billboards');
      expect(mockRedisDeleteValue).toHaveBeenCalledWith('usersbillboard');
    });
  });
  describe('create', () => {
    it('should create a billboard', async () => {
      mockPrismaCreateBillboard.mockReturnValue(mockCreatedBillboard);
      const result = await service.createBillboard(mockCreateData, mockStoreId);
      expect(result).toEqual(mockCreatedBillboard);
      expect(mockPrismaCreateBillboard).toHaveBeenCalledWith({
        data: {
          label: mockCreateData.label,
          imageUrl: mockCreateData.imageUrl,
          storeId: mockStoreId,
        },
      });
      expect(mockRedisDeleteValue).toHaveBeenCalledWith('billboards');
      expect(mockRedisDeleteValue).toHaveBeenCalledWith('usersbillboard');
    });
  });
  describe('getBillboardById', () => {
    it('should get a billboard by id if redis is not empty', async () => {
      mockRedisGetValueFromHash.mockReturnValue(mockGetBillboard);
      const result = await service.getBillboardById(mockGetBillboard.id);
      expect(result).toEqual(mockGetBillboard);
      expect(mockPrismaGetBillboardById).not.toHaveBeenCalled();
      expect(mockRedisGetValueFromHash).toHaveBeenCalledWith(
        mockGetBillboard.id,
        'billboard',
      );
    });
    it('should get a billboard by id if redis is empty', async () => {
      mockRedisGetValueFromHash.mockReturnValue(undefined);
      mockPrismaGetBillboardById.mockReturnValue(mockGetBillboard);
      const result = await service.getBillboardById(mockGetBillboard.id);
      expect(result).toEqual(mockGetBillboard);
      expect(mockPrismaGetBillboardById).toHaveBeenCalledWith({
        where: {
          id: mockGetBillboard.id,
        },
        select: {
          id: true,
          label: true,
          imageUrl: true,
        },
      });
      expect(mockRedisSetValueToHash).toHaveBeenCalledWith(
        mockGetBillboard.id,
        'billboard',
        JSON.stringify(mockGetBillboard),
      );
    });
  });
});
