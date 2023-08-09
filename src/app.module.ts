import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaService } from './prisma/prisma.service';
import { StoreService } from './store/store.service';
import { StoreController } from './store/store.controller';
import { StoreModule } from './store/store.module';
import { PrismaModule } from './prisma/prisma.module';
import { UserModule } from './user/user.module';
import { PassportModule } from '@nestjs/passport';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { UserInterceptor } from './user/intercepters/user.inteceptor';
import { AuthGuard } from './guards/auth.guard';
import { RedisModule } from './redis/redis.module';
import { BillboardController } from './billboard/billboard.controller';
import { BillboardService } from './billboard/billboard.service';
import { BillboardModule } from './billboard/billboard.module';
import { CategoryModule } from './category/category.module';
import { SizeModule } from './size/size.module';
import { ColorModule } from './color/color.module';
import { ProductModule } from './product/product.module';
import { OrderModule } from './order/order.module';
import { CheckoutModule } from './checkout/checkout.module';
import { WebhookModule } from './webhook/webhook.module';
import { ReviewModule } from './review/review.module';
import { RevenueModule } from './revenue/revenue.module';
@Module({
  imports: [
    StoreModule,
    PrismaModule,
    UserModule,
    PassportModule,
    RedisModule,
    BillboardModule,
    CategoryModule,
    SizeModule,
    ColorModule,
    ProductModule,
    OrderModule,
    CheckoutModule,
    WebhookModule,
    ReviewModule,
    RevenueModule,
  ],
  controllers: [AppController, StoreController, BillboardController],
  providers: [
    AppService,
    PrismaService,
    StoreService,

    {
      provide: APP_INTERCEPTOR,
      useClass: UserInterceptor,
    },
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
    BillboardService,
  ],
})
export class AppModule {}
