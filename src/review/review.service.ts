import { ConflictException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';

interface CreateReview {
  rating: number;
  comment: string;
  images: { url: string }[];
}
@Injectable()
export class ReviewService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly redisService: RedisService,
  ) {}
  //create review
  async createReview(
    userId: string,
    productId: string,
    createReview: CreateReview,
  ) {
    const order = await this.prismaService.orders.findFirst({
      where: {
        userId: userId,
        orderItems: {
          some: {
            productId: productId,
          },
        },
      },
      select: {
        id: true,
      },
    });
    if (!order) {
      throw new ConflictException('You have not ordered this product.');
    }
    const existingReview = await this.prismaService.review.findFirst({
      where: {
        userId: userId,
        productId: productId,
      },
      select: {
        id: true,
      },
    });

    if (existingReview) {
      throw new ConflictException('You have already reviewed this product.');
    }
    const review = await this.prismaService.review.create({
      data: {
        rating: createReview.rating,
        comment: createReview.comment,
        userId: userId,
        productId: productId,
      },
      select: {
        id: true,
      },
    });
    const reviewImage = createReview.images.map((image) => ({
      ...image,
      rewiewId: review.id,
    }));
    Promise.all([
      this.prismaService.reviewImage.createMany({
        data: reviewImage,
      }),
      this.redisService.deleteValue('product-reviews'),
      this.redisService.deleteValue('user-reviews'),
    ]);
    return review;
  }
  // check if user is eligible to review
  async checkIfUserIsEligibleToReview(userId: string, productId: string) {
    const order = await this.prismaService.orders.findFirst({
      where: {
        userId: userId,
        orderItems: {
          some: {
            productId: productId,
          },
        },
      },
      select: {
        id: true,
      },
    });
    if (!order) {
      return false;
    }
    const existingReview = await this.prismaService.review.findFirst({
      where: {
        userId: userId,
        productId: productId,
      },
      select: {
        id: true,
      },
    });

    if (existingReview) {
      return false;
    }
    return true;
  }
  // get user reviews
  async getUserReviews(userId: string) {
    const getReviewsFromCache = await this.redisService.getValueFromList(
      'user-reviews',
    );
    if (getReviewsFromCache && getReviewsFromCache.length !== 0)
      return getReviewsFromCache;
    const reviews = await this.prismaService.review.findMany({
      where: {
        userId: userId,
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
    await this.redisService.setValueToList(
      'user-reviews',
      JSON.stringify(reviews),
    );
    return reviews;
  }
  // delete review
  async deleteReview(reviewId: string, userId: string) {
    await this.prismaService.review.delete({
      where: {
        id: reviewId,
        userId: userId,
      },
    });
    Promise.all([
      this.redisService.deleteValue('product-reviews'),
      this.redisService.deleteValue('user-reviews'),
    ]);
    return 'Review deleted successfully.';
  }
  // get reviews for product
  async productReview(productId: string, page: number) {
    const take = 5;
    const skip = (page - 1) * take;
    const reviews = await this.prismaService.review.findMany({
      where: {
        productId: productId,
      },
      select: {
        id: true,
        rating: true,
        images: {
          select: {
            url: true,
          },
        },
        comment: true,
        createdAt: true,
        user: {
          select: {
            displayName: true,
            avatarUrl: true,
          },
        },
      },
      take: take,
      skip: skip,
    });
    // calculate average rating
    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = totalRating / reviews.length;
    return { reviews, averageRating };
  }
}
