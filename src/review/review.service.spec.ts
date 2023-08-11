import { Test, TestingModule } from '@nestjs/testing';
import { ReviewService } from './review.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { RedisService } from 'src/redis/redis.service';

describe('ReviewService', () => {
  let service: ReviewService;
  let prismaService: PrismaService;
  let redisService: RedisService;
  const mockCreateData = {
    rating: 5,
    comment: 'New Comment',
    images: [
      {
        url: 'image-url-1',
      },
      {
        url: 'image-url-2',
      },
    ],
  };

  const mockUserId = 'user-1';
  const mockProductId = 'product-1';
  const mockCreatedReview = 'Review created successfully.';
  const mockOrder = { id: 'order-1' };
  const mockPrismaCreateReview = jest.fn();
  const mockRedisDeleteValue = jest.fn();
  const mockPrismaFindFirstOrder = jest.fn();
  const mockPrismaFindFirstReview = jest.fn();
  const mockPrismaReviewImageCreateMany = jest.fn();

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReviewService,
        {
          provide: PrismaService,
          useValue: {
            review: {
              create: mockPrismaCreateReview,
              findFirst: mockPrismaFindFirstReview,
            },
            reviewImage: {
              createMany: mockPrismaReviewImageCreateMany,
            },
            orders: {
              findFirst: mockPrismaFindFirstOrder,
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

    service = module.get<ReviewService>(ReviewService);
  });
  afterAll(() => {
    jest.resetAllMocks();
  });

  describe('create', () => {
    it('should create a review', async () => {
      mockPrismaCreateReview.mockReturnValue(mockCreatedReview);
      mockPrismaFindFirstOrder.mockReturnValue(mockOrder);
      mockPrismaFindFirstReview.mockReturnValue(null);
      const result = await service.createReview(
        mockUserId,
        mockProductId,
        mockCreateData,
      );
      expect(result).toEqual(mockCreatedReview);
      expect(mockPrismaFindFirstOrder).toHaveBeenCalledWith({
        where: {
          userId: mockUserId,
          orderItems: {
            some: {
              productId: mockProductId,
            },
          },
        },
        select: {
          id: true,
        },
      });
      expect(mockPrismaFindFirstReview).toHaveBeenCalledWith({
        where: {
          userId: mockUserId,
          productId: mockProductId,
        },
        select: {
          id: true,
        },
      });
      expect(mockPrismaCreateReview).toHaveBeenCalledWith({
        data: {
          rating: mockCreateData.rating,
          comment: mockCreateData.comment,
          userId: mockUserId,
          productId: mockProductId,
        },
      });
      expect(mockRedisDeleteValue).toHaveBeenCalledWith('product-reviews');
      expect(mockRedisDeleteValue).toHaveBeenCalledWith('user-reviews');
    });
  });
});
