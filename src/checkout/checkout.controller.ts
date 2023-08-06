import { Body, Controller, Post } from '@nestjs/common';
import { CheckoutService } from './checkout.service';
import { CreateCheckoutDto } from './dto/checkout.dto';
import { User, userType } from 'src/user/decorators/user.decrator';
import { Roles } from 'src/decoratores/role.decorator';

@Controller('checkout')
export class CheckoutController {
  constructor(private readonly checkoutService: CheckoutService) {}
  @Roles('USER')
  @Post('')
  async checkout(@Body() data: CreateCheckoutDto, @User() user: userType) {
    return await this.checkoutService.createCheckout(
      data,
      user.userId,
      '16694a2e-62d6-4b22-84cc-7f5589abd799',
    );
  }
}
