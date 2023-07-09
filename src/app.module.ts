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
import { GoogleStrategy } from './user/auth/google.strategy';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { UserInterceptor } from './user/intercepters/user.inteceptor';
import { AuthGuard } from './guard/auth.guard';
@Module({
  imports: [StoreModule, PrismaModule, UserModule, PassportModule],
  controllers: [AppController, StoreController],
  providers: [
    AppService,
    PrismaService,
    StoreService,
    GoogleStrategy,

    {
      provide: APP_INTERCEPTOR,
      useClass: UserInterceptor,
    },
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
  ],
})
export class AppModule {}
