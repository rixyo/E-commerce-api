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
