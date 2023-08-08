import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import { ReviewService } from './review.service';
import { Roles } from 'src/decoratores/role.decorator';
import { User, userType } from 'src/user/decorators/user.decrator';
import { CreateReviewDto } from './dto/review.dto';

@Controller('review')
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) {}
  @Roles('USER')
  @Post(':productId/create')
  async createReview(
    @Param('productId', new ParseUUIDPipe()) productId: string,
    @User() user: userType,
    @Body() body: CreateReviewDto,
  ) {
    return await this.reviewService.createReview(user.userId, productId, body);
  }
  @Roles('USER')
  @Get(':productId/check')
  async checkIfUserOrderedProduct(
    @User() user: userType,
    @Param('productId', new ParseUUIDPipe()) productId: string,
  ) {
    return await this.reviewService.checkIfUserIsEligibleToReview(
      user.userId,
      productId,
    );
  }
  @Roles('USER')
  @Get('')
  async getAllReviews(@User() user: userType) {
    return await this.reviewService.getUserReviews(user.userId);
  }
  @Roles('USER')
  @Delete(':id')
  async deleteReview(
    @Param('id', new ParseUUIDPipe()) reviewId: string,
    @User() user: userType,
  ) {
    return await this.reviewService.deleteReview(reviewId, user.userId);
  }
  @Get(':productId')
  async getProductReviews(
    @Param('productId', new ParseUUIDPipe()) productId: string,
    @Query('page') page: number,
  ) {
    return await this.reviewService.getReviews(productId, page);
  }
}
