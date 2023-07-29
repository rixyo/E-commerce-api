import { Controller, Get, Post, Body, Patch } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDTO, SingupDTO, UpdateUserDTO } from './dot/auth.dto';
import { Roles } from 'src/decoratores/role.decorator';
import { User, userType } from '../decorators/user.decrator';
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}
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
  @Roles('ADMIN', 'USER')
  @Get('me')
  async me(@User() user: userType) {
    return this.authService.currentUser(user.userId);
  }
  @Roles('ADMIN', 'USER')
  @Patch('update')
  async update(@User() user: userType, @Body() body: UpdateUserDTO) {
    return this.authService.updateUserInfo(body, user.userId);
  }
}
