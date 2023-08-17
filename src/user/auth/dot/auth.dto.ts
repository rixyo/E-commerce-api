import { Exclude } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

type UserRole = 'ADMIN' | 'USER';
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
export class RestPasswordDTO {
  @IsEmail()
  @IsNotEmpty()
  email: string;
}
export class UpdatePasswordDTO {
  @IsEmail()
  @IsNotEmpty()
  email: string;
  @IsString()
  @IsNotEmpty()
  password: string;
  @IsString()
  @IsNotEmpty()
  token: string;
}
