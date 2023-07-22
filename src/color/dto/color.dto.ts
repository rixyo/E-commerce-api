import { IsNotEmpty, IsString } from 'class-validator';

export class createColorDto {
  @IsNotEmpty()
  @IsString()
  name: string;
  @IsNotEmpty()
  @IsString()
  value: string;
}
