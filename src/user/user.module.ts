import { Module } from '@nestjs/common';
import { AuthService } from './auth/auth.service';
import { AuthController } from './auth/auth.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { GoogleStrategy } from './auth/google.strategy';
@Module({
  imports: [PrismaModule],
  exports: [AuthService],
  providers: [AuthService, GoogleStrategy],
  controllers: [AuthController],
})
export class UserModule {}
