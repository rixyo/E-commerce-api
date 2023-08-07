import { ConflictException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { RedisService } from 'src/redis/redis.service';

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
    });
    if (!order) {
      throw new ConflictException('You have not ordered this product.');
    }
    const existingReview = await this.prismaService.review.findFirst({
      where: {
        userId: userId,
        productId: productId,
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
    });
    const reviewImage = createReview.images.map((image) => ({
      ...image,
      rewiewId: review.id,
    }));
    await this.prismaService.reviewImage.createMany({
      data: reviewImage,
    });
    return 'Review created successfully.';
  }
}
