import { Body, Controller, Param, ParseUUIDPipe, Post } from '@nestjs/common';
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
}
