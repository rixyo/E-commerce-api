import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { CreateCategoryDto } from './dto/category.dto';
import { CategoryService } from './category.service';
import { Roles } from 'src/decoratores/role.decorator';

@Controller('category')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}
  @Get(':storeId/findall')
  async getAllCategories(
    @Param('storeId', new ParseUUIDPipe()) storeId: string,
  ) {
    return await this.categoryService.getAllCategories(storeId);
  }
  @Get(':id')
  async getCategoryById(@Param('id', new ParseUUIDPipe()) id: string) {
    return await this.categoryService.getCategoryById(id);
  }
  @Roles('ADMIN')
  @Post(':storeId/create')
  async createCategory(
    @Param('storeId', new ParseUUIDPipe()) storeId: string,
    @Body() data: CreateCategoryDto,
  ) {
    return await this.categoryService.createCategory(
      data.name,
      storeId,
      data.billboardId,
    );
  }
  @Roles('ADMIN')
  @Patch(':storeId/update/:id')
  async updateCategoryById(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Param('storeId', new ParseUUIDPipe()) storeId: string,
    @Body() data: CreateCategoryDto,
  ) {
    return await this.categoryService.updateCategoryById(id, data.name);
  }
  @Roles('ADMIN')
  @Delete(':id')
  async deleteCategoryById(@Param('id', new ParseUUIDPipe()) id: string) {
    return await this.categoryService.deleteCategoryById(id);
  }
}
