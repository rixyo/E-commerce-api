import { IsNotEmpty, IsString } from 'class-validator';

export class createSizeDto {
  @IsNotEmpty()
  @IsString()
  name: string;
  @IsNotEmpty()
  @IsString()
  value: string;
}
