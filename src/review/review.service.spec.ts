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
  const mockReviews = [
    {
      id: 'review-1',
      rating: 5,
      images: [
        {
          url: 'image-url-1',
        },
      ],
      comment: 'New Comment',
      createdAt: '2021-08-09T08:00:00.000Z',
      product: {
        name: 'New Product',
        price: '100',
        Images: [
          {
            url: 'image-url-1',
          },
        ],
      },
    },
  ];

  const mockUserId = 'user-1';
  const mockProductId = 'product-1';
  const mockCreatedReview = 'Review created successfully.';
  const mockOrder = { id: 'order-1' };
  const mockPrismaCreateReview = jest.fn();
  const mockPrismaGetAllReviews = jest.fn();
  const mockPrismaFindFirstOrder = jest.fn();
  const mockPrismaFindFirstReview = jest.fn();
  const mockPrismaReviewImageCreateMany = jest.fn();

  const mockRedisDeleteValue = jest.fn();
  const mockRedisSetValueToList = jest.fn();
  const mockRedisGetValueFromList = jest.fn();

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
              findMany: mockPrismaGetAllReviews,
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
            setValueToList: mockRedisSetValueToList,
            getValueFromList: mockRedisGetValueFromList,
          },
        },
      ],
    }).compile();

    service = module.get<ReviewService>(ReviewService);
  });
  afterAll(() => {
    jest.resetAllMocks();
  });

  describe('getAllReviews', () => {
    it('should get all reviews if cahed is empty', async () => {
      mockPrismaGetAllReviews.mockReturnValue(mockReviews);
      mockRedisGetValueFromList.mockReturnValue(null);
      const result = await service.getUserReviews(mockUserId);
      expect(result).toEqual(mockReviews);
      expect(mockPrismaGetAllReviews).toHaveBeenCalledWith({
        where: {
          userId: mockUserId,
        },
        select: {
          id: true,
          rating: true,
          images: {
            select: {
              url: true,
            },
            take: 1,
          },
          comment: true,
          createdAt: true,
          product: {
            select: {
              name: true,
              price: true,
              Images: {
                select: {
                  url: true,
                },
                take: 1,
              },
            },
          },
        },
      });
      expect(mockRedisSetValueToList).toHaveBeenCalledWith(
        'user-reviews',
        JSON.stringify(mockReviews),
      );
    });
    it('should get all reviews if cahed is not empty', async () => {
      mockRedisGetValueFromList.mockReturnValue(mockReviews);
      const result = await service.getUserReviews(mockUserId);
      expect(result).toEqual(mockReviews);
    });
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
