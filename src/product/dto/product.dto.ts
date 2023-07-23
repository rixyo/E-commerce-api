import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
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
  @IsString()
  description: string;
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => Image)
  images: Image[];
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => Size)
  sizes: Size[];
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => Color)
  colors: Color[];
  @IsOptional()
  @IsBoolean()
  isFeatured: boolean;
  @IsOptional()
  @IsBoolean()
  isArchived: boolean;
}
class Color {
  @IsString()
  @IsNotEmpty()
  value: string;
}
class Size {
  @IsString()
  @IsNotEmpty()
  value: string;
}
class Image {
  @IsString()
  @IsNotEmpty()
  url: string;
}
