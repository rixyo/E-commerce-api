import { IsNotEmpty, IsString } from 'class-validator';

export class createBillboardDto {
  @IsString()
  @IsNotEmpty()
  label: string;
  @IsString()
  @IsNotEmpty()
  imageUrl: string;
}
