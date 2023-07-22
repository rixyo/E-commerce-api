import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';

export class createProductDto {
  @IsNotEmpty()
  @IsString()
  name: string;
  @IsNotEmpty()
  @IsNumber()
  price: number;
  @IsNotEmpty()
  @IsUUID()
  categoryId: string;
  @IsNotEmpty()
  @IsUUID()
  colorId: string;
  @IsNotEmpty()
  @IsUUID()
  sizeId: string;
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => Image)
  images: Image[];
  @IsNotEmpty()
  @IsBoolean()
  isFeatured: boolean;
  @IsNotEmpty()
  @IsBoolean()
  isArchived: boolean;
}
class Image {
  @IsString()
  @IsNotEmpty()
  url: string;
}
