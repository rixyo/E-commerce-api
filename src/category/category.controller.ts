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
import { Roles } from '../decoratores/role.decorator';

@Controller('category')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}
  @Get(':storeId/men')
  async getMenCategories(
    @Param('storeId', new ParseUUIDPipe()) storeId: string,
  ) {
    return await this.categoryService.getMenCategories(storeId);
  }
  @Get(':storeId/women')
  async getWomwnCategories(
    @Param('storeId', new ParseUUIDPipe()) storeId: string,
  ) {
    return await this.categoryService.getWomenCategories(storeId);
  }

  @Get(':storeId/all')
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
    return await this.categoryService.createCategory(data, storeId);
  }
  @Roles('ADMIN')
  @Patch(':id/update')
  async updateCategoryById(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() data: CreateCategoryDto,
  ) {
    return await this.categoryService.updateCategory(id, data);
  }
  @Roles('ADMIN')
  @Delete(':id')
  async deleteCategoryById(@Param('id', new ParseUUIDPipe()) id: string) {
    return await this.categoryService.deleteCategory(id);
  }
}
