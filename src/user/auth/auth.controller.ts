import { Controller, Get, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDTO, SingupDTO } from './dot/auth.dto';
import { Roles } from 'src/decoratores/role.decorator';
import { User, userType } from '../decorators/user.decrator';
import { RedisService } from 'src/redis/redis.service';
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly redis: RedisService,
  ) {}
  @Post('login')
  async login(@Body() body: LoginDTO) {
    return this.authService.validateUserFromEmailPassword(
      body.email,
      body.password,
    );
  }
  @Post('signup')
  async signup(@Body() body: SingupDTO) {
    return this.authService.signupWithEmailPassword(
      body.email,
      body.displayName,
      body.password,
    );
  }
  @Roles('ADMIN')
  @Get('me')
  async me(@User() user: userType) {
    return this.authService.currentUser(user.userId);
  }
}
