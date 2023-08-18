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
import { Roles } from '../decoratores/role.decorator';
import { User, userType } from '../user/decorators/user.decrator';
import { CreateReviewDto } from './dto/review.dto';

@Controller('review')
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) {}
  @Roles('USER', 'ADMIN')
  @Post(':productId/:storeId/create')
  async createReview(
    @Param('productId', new ParseUUIDPipe()) productId: string,
    @User() user: userType,
    @Param('storeId', new ParseUUIDPipe()) storeId: string,
    @Body() body: CreateReviewDto,
  ) {
    return await this.reviewService.createReview(
      user.userId,
      productId,
      body,
      storeId,
    );
  }
  @Roles('USER', 'ADMIN')
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
  @Roles('USER', 'ADMIN')
  @Get('')
  async getAllReviews(@User() user: userType) {
    return await this.reviewService.getUserReviews(user.userId);
  }
  @Roles('USER', 'ADMIN')
  @Delete(':id/delete/:storeId')
  async deleteReview(
    @Param('id', new ParseUUIDPipe()) reviewId: string,
    @Param('storeId', new ParseUUIDPipe()) storeId: string,
    @User() user: userType,
  ) {
    return await this.reviewService.deleteReview(
      reviewId,
      user.userId,
      storeId,
    );
  }
  @Get(':productId')
  async getProductReviews(
    @Param('productId', new ParseUUIDPipe()) productId: string,
    @Query('page') page: number,
  ) {
    return await this.reviewService.productReview(productId, page);
  }
}
