// Purpose: Custom decorator to set roles for a route
import { SetMetadata } from '@nestjs/common';
type UserRole = 'ADMIN' | 'USER';
export const Roles = (...roles: UserRole[]) => SetMetadata('roles', roles);
