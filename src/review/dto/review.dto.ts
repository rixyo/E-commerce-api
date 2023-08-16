import { Type } from 'class-transformer';
import {
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsString,
  ValidateNested,
} from 'class-validator';

export class CreateReviewDto {
  @IsNotEmpty()
  @IsNumber()
  rating: number;
  @IsNotEmpty()
  @IsString()
  comment: string;
  @IsArray()
  @IsNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => Image)
  images: Image[];
}
class Image {
  @IsString()
  @IsNotEmpty()
  url: string;
}
