// Purpose: User interceptor for user module.
import { CallHandler, ExecutionContext, NestInterceptor } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';

export class UserInterceptor implements NestInterceptor {
  async intercept(context: ExecutionContext, handler: CallHandler) {
    // Get token from request header.
    const request = context.switchToHttp().getRequest();
    const token = request?.headers?.authorization?.split('Bearer ')[1];
    // Decode token and set user to request.
    const user = jwt.decode(token);
    request.user = user;
    return handler.handle();
  }
}
