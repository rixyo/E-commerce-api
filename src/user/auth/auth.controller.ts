import { Controller, Get, Post, Body, Patch, HttpCode } from '@nestjs/common';
import { AuthService } from './auth.service';
import {
  LoginDTO,
  RestPasswordDTO,
  SingupDTO,
  UpdatePasswordDTO,
  UpdateUserDTO,
} from './dot/auth.dto';
import { Roles } from '../../decoratores/role.decorator';
import { User, userType } from '../decorators/user.decrator';
import { EmailService } from '../../email/email.service';
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly emailService: EmailService,
  ) {}
  @Roles('ADMIN', 'USER')
  @Get('me')
  async me(@User() user: userType) {
    return this.authService.currentUser(user.userId);
  }
  @HttpCode(200)
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

  @Post('forgot-password')
  async forgotPassword(@Body() body: RestPasswordDTO) {
    let message: string;
    const user = await this.authService.isUserExist(body.email);
    if (!user) {
      message = 'User not found';
      return message;
    }
    message = 'Email sent successfully';
    await this.emailService.sendEmail(body.email);
    return message;
  }
  @Roles('ADMIN', 'USER')
  @Patch('update')
  async update(@User() user: userType, @Body() body: UpdateUserDTO) {
    return this.authService.updateUserInfo(body, user.userId);
  }
  @Post('reset-password')
  async resetPassword(@Body() body: UpdatePasswordDTO) {
    return this.authService.resetPassword(body);
  }
}
