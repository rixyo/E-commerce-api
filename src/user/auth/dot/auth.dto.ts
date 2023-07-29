import { UserRole } from '@prisma/client';
import { Exclude } from 'class-transformer';
import { IsEmail, IsString } from 'class-validator';

export class SingupDTO {
  @IsEmail()
  email: string;
  @IsString()
  displayName: string;
  @IsString()
  password: string;
}
export class LoginDTO {
  @IsEmail()
  email: string;
  @IsString()
  password: string;
}
export class ResponseUserDTO {
  id: string;
  displayName: string;
  userRole: UserRole;
  email: string;
  @Exclude()
  password: string;
  @Exclude()
  created_at: Date;
  @Exclude()
  updated_at: Date;
  constructor(partial: Partial<ResponseUserDTO>) {
    Object.assign(this, partial);
  }
}
export class UpdateUserDTO {
  @IsString()
  displayName: string;
  @IsEmail()
  email: string;
  @IsString()
  avaterUrl: string;
}
