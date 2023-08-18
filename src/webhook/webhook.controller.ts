import { Controller, Post, Headers, Req } from '@nestjs/common';
import { WebhookService } from './webhook.service';

@Controller('webhook')
export class WebhookController {
  constructor(private readonly webhook: WebhookService) {}
  @Post('')
  async webhookHandler(
    @Req() req: any,
    @Headers('stripe-signature') signature: string,
  ) {
    return await this.webhook.webhook(req.rawBody, signature);
  }
}
