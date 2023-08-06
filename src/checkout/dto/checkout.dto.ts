import { IsArray, IsNotEmpty } from 'class-validator';

export class CreateCheckoutDto {
  @IsNotEmpty()
  @IsArray()
  productIds: string[];
  @IsNotEmpty()
  @IsArray()
  quantity: number[];
  @IsNotEmpty()
  @IsArray()
  size: string[];
  @IsNotEmpty()
  @IsArray()
  color: string[];
}
