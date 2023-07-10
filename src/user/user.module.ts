import { Module } from '@nestjs/common';
import { AuthService } from './auth/auth.service';
import { AuthController } from './auth/auth.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
@Module({
  imports: [PrismaModule],
  exports: [AuthService],
  providers: [AuthService],
  controllers: [AuthController],
})
export class UserModule {}
