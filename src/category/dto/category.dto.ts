import { Exclude } from 'class-transformer';
import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class CategoriesResponseDto {
  id: string;
  name: string;
  storeId: string;
  billboard: {
    label: string;
  };
  createdAt: Date;
  @Exclude()
  updatedAt: Date;
  constructor(partial: Partial<CategoriesResponseDto>) {
    Object.assign(this, partial);
  }
}
export class CreateCategoryDto {
  @IsString()
  @IsNotEmpty()
  name: string;
  @IsUUID()
  @IsNotEmpty()
  billboardId: string;
  @IsNotEmpty()
  @IsString()
  gender: string;
  @IsNotEmpty()
  @IsString()
  imageUrl: string;
}
