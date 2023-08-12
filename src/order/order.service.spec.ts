import { Test, TestingModule } from '@nestjs/testing';
import { OrderService } from './order.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { RedisService } from 'src/redis/redis.service';

describe('OrderService', () => {
  let service: OrderService;
  let prismaService: PrismaService;
  let redisService: RedisService;
  const mockGetValue = {
    id: '1',
    isDelivered: false,
    deliveredAt: '2021-09-01T00:00:00.000Z',
  };
  const updateOrderData = {
    isDelivered: true,
    deliveredAt: '2021-09-01T00:00:00.000Z',
  };
  const mockGetPandingOrders = [
    {
      id: '1',
      createdAt: '2021-09-01T00:00:00.000Z',
      isDelivered: false,
      orderItems: [
        {
          id: '1',
          product: [
            {
              id: '1',
              name: 'New Product',
              Images: [
                {
                  id: 'image-1',
                  url: 'src1',
                },
              ],
              quintity: 1,
              size: 'L',
              color: 'Red',
            },
          ],
        },
      ],
    },
  ];
  const mockPrismaFindUnique = jest.fn();
  const mockPrismaUpdate = jest.fn();
  const mockPrismaGetPandingOrders = jest.fn();
  const mockPrismaGetDeliveredOrders = jest.fn();
  const mockPrismaDeleteOrder = jest.fn();

  const redisGetValueFromHash = jest.fn();
  const redisSetValueToHash = jest.fn();
  const redisDeleteValue = jest.fn();
  const redisSetValueToList = jest.fn();
  const redisGetValueFromList = jest.fn();

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrderService,
        {
          provide: PrismaService,
          useValue: {
            orders: {
              findUnique: mockPrismaFindUnique,
              findMany: mockPrismaGetPandingOrders,
              mockPrismaGetDeliveredOrders,
              delete: mockPrismaDeleteOrder,
              update: mockPrismaUpdate,
            },
          },
        },
        {
          provide: RedisService,
          useValue: {
            deleteValue: redisDeleteValue,
            getValueFromHash: redisGetValueFromHash,
            setValueToHash: redisSetValueToHash,
            setValueToList: redisSetValueToList,
            getValueFromList: redisGetValueFromList,
          },
        },
      ],
    }).compile();

    service = module.get<OrderService>(OrderService);
    prismaService = module.get<PrismaService>(PrismaService);
    redisService = module.get<RedisService>(RedisService);
  });
  afterEach(() => {
    jest.resetAllMocks();
  });
  describe('deleteOrder', () => {
    it('should delete order and delete cache values', async () => {
      await service.deleteOrder('1');
      expect(mockPrismaDeleteOrder).toHaveBeenCalledWith({
        where: {
          id: '1',
        },
      });
      expect(redisDeleteValue).toHaveBeenCalledWith('admin-orders');
      expect(redisDeleteValue).toHaveBeenCalledWith('1');
      expect(redisDeleteValue).toHaveBeenCalledWith('pendding-orders');
      expect(redisDeleteValue).toHaveBeenCalledWith('delivered-orders');
      expect(redisDeleteValue).toHaveBeenCalledWith('total_revenue');
    });
  });
  describe('getDeliveredOrders', () => {
    it('should get all delivered orders if redis is not empty', async () => {
      redisGetValueFromList.mockReturnValue(mockGetPandingOrders);
      const result = await service.getUserDeliveredOrders('1');
      expect(result).toEqual(mockGetPandingOrders);
      expect(redisGetValueFromList).toHaveBeenCalledWith('delivered-orders');
      expect(mockPrismaGetDeliveredOrders).not.toHaveBeenCalled();
    });
    it('should get all delivered orders if redis is empty', async () => {
      mockPrismaGetDeliveredOrders.mockReturnValue(mockGetPandingOrders);
      redisGetValueFromList.mockReturnValue(undefined);
      const result = await service.getUserDeliveredOrders('1');
      expect(result).toEqual(mockGetPandingOrders);
      expect(mockPrismaGetDeliveredOrders).toHaveBeenCalledWith({
        where: {
          userId: '1',
          isDelivered: true,
        },
        select: {
          id: true,
          createdAt: true,
          orderItems: {
            select: {
              id: true,
              product: {
                select: {
                  id: true,
                  name: true,
                  Images: {
                    select: {
                      url: true,
                    },
                    take: 1,
                  },
                },
              },
              quantity: true,
              size: true,
              color: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
      expect(redisSetValueToList).toHaveBeenCalledWith(
        'delivered-orders',
        JSON.stringify(mockGetPandingOrders),
      );
    });
  });

  describe('getPandingOrders', () => {
    it('should get all pendding orders if redis is not empty', async () => {
      redisGetValueFromList.mockReturnValue(mockGetPandingOrders);
      const result = await service.getUserPenddingOrders('1');
      expect(result).toEqual(mockGetPandingOrders);
      expect(redisGetValueFromList).toHaveBeenCalledWith('pendding-orders');
      expect(mockPrismaGetPandingOrders).not.toHaveBeenCalled();
    });
    it('should get all pendding orders if redis is empty', async () => {
      mockPrismaGetPandingOrders.mockReturnValue(mockGetPandingOrders);
      redisGetValueFromList.mockReturnValue(undefined);
      const result = await service.getUserPenddingOrders('1');
      expect(result).toEqual(mockGetPandingOrders);
      expect(mockPrismaGetPandingOrders).toHaveBeenCalledWith({
        where: {
          userId: '1',
          isDelivered: false,
        },
        select: {
          id: true,
          createdAt: true,
          orderItems: {
            select: {
              id: true,
              product: {
                select: {
                  id: true,
                  name: true,
                  Images: {
                    select: {
                      url: true,
                    },
                    take: 1,
                  },
                },
              },
              quantity: true,
              size: true,
              color: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
      expect(redisSetValueToList).toHaveBeenCalledWith(
        'pendding-orders',
        JSON.stringify(mockGetPandingOrders),
      );
    });
  });
  describe('updateOrder', () => {
    it('should update an order', async () => {
      mockPrismaUpdate.mockReturnValue('order updated successfully');
      const restul = await service.updateOrder('1', updateOrderData);
      expect(restul).toEqual('order updated successfully');
      expect(mockPrismaUpdate).toHaveBeenCalledWith({
        where: {
          id: '1',
        },
        data: {
          isDelivered: true,
          deliveredAt: '2021-09-01T00:00:00.000Z',
        },
      });
      expect(redisDeleteValue).toHaveBeenCalledWith('admin-orders');
      expect(redisDeleteValue).toHaveBeenCalledWith('1');
      expect(redisDeleteValue).toHaveBeenCalledWith('pendding-orders');
      expect(redisDeleteValue).toHaveBeenCalledWith('delivered-orders');
      expect(redisDeleteValue).toHaveBeenCalledWith('total_revenue');
    });
  });
  describe('getById', () => {
    it('should get an order by id if redis is not empty', async () => {
      redisGetValueFromHash.mockReturnValue(mockGetValue);
      const result = await service.getOrderById('1');
      expect(result).toEqual(mockGetValue);
      expect(redisGetValueFromHash).toHaveBeenCalledWith('1', 'order');
    });
    it('should get an order by id if redis is empty', async () => {
      mockPrismaFindUnique.mockReturnValue(mockGetValue);
      redisGetValueFromHash.mockReturnValue(null);
      const result = await service.getOrderById('1');
      expect(result).toEqual(mockGetValue);
      expect(mockPrismaFindUnique).toHaveBeenCalledWith({
        where: {
          id: '1',
        },
        select: {
          id: true,
          isDelivered: true,
          deliveredAt: true,
        },
      });
      expect(redisGetValueFromHash).toHaveBeenCalledWith('1', 'order');
    });
  });
});
