// Purpose: Custom decorator to set roles for a route
import { SetMetadata } from '@nestjs/common';
import { UserRole } from '@prisma/client';
export const Roles = (...roles: UserRole[]) => SetMetadata('roles', roles);
