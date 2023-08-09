// Purpose: Custom decorator to get user from request object
import { createParamDecorator, ExecutionContext } from '@nestjs/common';
export interface userType {
  userId: string;
  iat: number;
  exp: number;
}

export const User = createParamDecorator((data, context: ExecutionContext) => {
  // Get user from request object.
  const request = context.switchToHttp().getRequest();
  return request.user as userType;
});
