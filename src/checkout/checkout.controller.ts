import { Body, Controller, Post, Headers, Req } from '@nestjs/common';
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
      '1b8c58fd-7e17-41ee-a7c4-4b8f0d2d4e0e',
    );
  }
  @Post('webhook')
  async stripeWebhook(
    @Headers('stripe-signature') sig: string,
    @Req() req: any,
  ) {
    return await this.checkoutService.webhook(req.rawBody, sig);
  }
}
